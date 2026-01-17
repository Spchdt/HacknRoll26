HacknRoll26 - System Requirements
This document serves as the basic system requirements (so-called MVP) to finish within the hackathon timeframe. It does not go through specific UI details or coding implementation, but it is good enough to be fed to AI agents to complete the workflow, potentially within 12 hours.

The app backend shall be deployed on Cloudflare Workers for auto-scaling and ease of serverless deployment and inter-service communication (using the default RPC mechanism).

Overall Architecture

Web Frontend: User-facing React application
User Backend: A Hono backend for processing basic CRUD requests, authentication, and user-facing events
Data Service: Another Hono microservice for long-running and scheduled tasks, such as daily puzzle generation and solving (separated to reduce load on the main server and ensure responsiveness)

Note: The frontend only interacts with the user backend.

Web Frontend Overview

Overall, the UI and gameplay style should be similar to Wordle since we want to replicate its experience. The flow of the user should be as follows.

The user goes to the website for the first time. There is an optional tutorial on how the system works as well as some small examples on how to play the game. Users should be able to skip this.
The authentication would simply use Cloudflare request headers to grab the user's IP address and device information and hash them as a unique identifier alongside a generated Nano ID.
Users can then start a game (daily) and interact with the game through git commands. Undo is easy to implement since the backend can keep the game as a stack (LIFO data structure), which will pop the last state to revert.
There are of course some quotas on git commands that can be used, such as how many times the user can checkout (either to a branch or to some detached HEAD), how many commands are allowed, and how many consecutive commits are okay (to encourage some rebasing).
There should be some frontend UI details that let the user know or prevent the user from performing disallowed actions, though the backend will also handle that validation anyway.
When the user finishes the game, there are two scenarios. For returning users, their stats are automatically saved and the leaderboard is scheduled to be updated accordingly. For new users, they can choose whether they want to appear on the leaderboard or not. If so, they can choose a username. Otherwise, they are not on the leaderboard, but the progress is saved anyway since we can still grab the information needed to authenticate the user.
In addition to the above, the game should show a popup displaying the optimal solution (or more precisely, the one that the algorithmic solver came up with). The backend gives rewards relative to how well the user performed compared to the official solution.
As suggested in points 6 and 7, we should have a leaderboard tab and personal stats tab that display win rate, command usage, and similar metrics. We can later decide what information we want to display or how to construct the leaderboard and player stats.
There is also a tab called HacknRoll26 Archive which collects all past puzzles of the game. Users can browse to go back and practice. However, their records will not be saved in the leaderboard. But progress can be saved in the database to ensure that they can track their history or reset.


User Backend

POST /game/start

Note: We either pass a game ID (for non-daily puzzles) or set ID to "daily" for the daily puzzle. The user backend will look up the actual daily ID later to ensure data integrity.

Construct a user ID based on the IP address and device information grabbed from Cloudflare headers, then proxy the request to the Durable Objects in the data service.
The game states are managed through Durable Objects and are part of the data service.
If the game is already started, just restore the latest state and return that state back so commands can proceed.
When the game has already ended, the endpoint would return information about the user rewards, and the frontend can proceed to render them appropriately.

POST /game/command

Note: In addition to the game ID above, there should be a command type (commit, branch, checkout, merge, or rebase) and related parameters such as the commit message passed in the body to this endpoint (we will specify the exact format later). Undo can be treated as a special kind of command.

This should work the same as game start. It is handled on the Durable Object in the data service. No special logic is needed on the user backend side.
Same as when the game ends, the last command will also return a message indicating that the game has already ended.

POST /user/set-name

This endpoint saves the username to the database based on user ID. The name will be null initially if the user did not want to appear on the leaderboard.

GET /stats

Return the user performance so far.

GET /leaderboard

Return the top 50 users on the leaderboard. It also shows where the current user ranks if they are not within the top 50.

Data Service

Scheduled Tasks

Six hours before midnight UTC, generate a new game. This involves running the puzzle generator with a seed derived from the upcoming date, then running the solver to compute the optimal solution and par score. The generated puzzle along with its solution should be stored in KV under a key like "puzzle:YYYY-MM-DD" with appropriate metadata including the difficulty level, file targets, constraints, and the precomputed solution.
At midnight UTC, generate a new leaderboard snapshot. This involves querying the database for all completed games from the previous day, aggregating scores by user, computing ranks, and storing the results. The leaderboard data should be cached in KV for fast retrieval since it will be read frequently but only written once per day.

Durable Objects for Managing Game State

Each active game session should have its own Durable Object instance identified by a composite key of the user ID and the puzzle ID. This ensures strong consistency for game state mutations and prevents race conditions when multiple requests arrive simultaneously.

The Durable Object maintains an in-memory representation of the current game state including the git graph (commits, branches, HEAD position), the list of collected files, and a stack of previous states for undo functionality.
On instantiation or wake-up, the Durable Object should hydrate its state from its internal storage. If no state exists, it initializes a fresh game by fetching the puzzle definition from KV using the puzzle ID.
When a command is received, the Durable Object validates the command against the puzzle constraints, executes the command through the git engine logic, checks for file collection at the new position, updates the state, pushes the previous state onto the undo stack, and persists everything to storage before returning the result.
For the undo command, the Durable Object pops the last state from the stack and restores it as the current state. If the stack is empty, it returns an error indicating nothing to undo.
When the game ends, the Durable Object marks the game as complete, calculates the score based on commands used versus par, and triggers a message to the queue for leaderboard update processing.
The Durable Object should implement an alarm to clean up stale sessions. If a game has been inactive for more than 24 hours without completion, it can be marked as abandoned and its state can be archived or deleted to free resources.

Game Play, Generation, and Solver Logic

The player cannot lose the game. It is either win or fail to complete the game within the time limit. The winning condition is to collect all files and merge them to the main branch (at least one merge or rebase is guaranteed to be used).

The git engine maintains a simplified but accurate model of a git repository. Commits are represented as nodes with parent pointers forming a directed acyclic graph. Branches are named pointers to commit nodes. HEAD can point to either a branch (attached) or directly to a commit (detached).
The commit command creates a new commit node with the current HEAD commit as its parent, then advances the current branch pointer to this new commit. If HEAD is detached, the commit is created but no branch is moved, and HEAD becomes detached at the new commit.
The branch command creates a new named pointer at the current HEAD commit without changing HEAD or any other state. Since the puzzle is a grid, the branch name is predefined, and creating arbitrary branches is not allowed.
The checkout command moves HEAD to the specified target. If the target is a branch name, HEAD becomes attached to that branch. If the target is a commit ID, HEAD becomes detached at that commit.
The merge command creates a new commit with two parents: the current HEAD commit and the tip of the specified branch. The current branch advances to this merge commit. Fast-forward merges occur when the current commit is an ancestor of the target, in which case the branch pointer simply moves forward without creating a merge commit.
The rebase command replays commits from the current branch onto a new base. It finds the common ancestor between the current branch and the target, collects all commits from the ancestor to the current tip, then recreates each commit on top of the target branch tip. The original commits remain in the graph but are no longer referenced by any branch.
File collection occurs when a commit is created at a specific branch and depth combination that matches a target file location. The game tracks which files have been collected and checks for win conditions after each command.
The puzzle generator creates valid puzzles by randomly placing file targets across branches and depths according to difficulty parameters, then running the solver to verify solvability and determine the optimal solution length. If the puzzle does not meet the difficulty criteria (par too low, par too high, does not require expected commands), it is discarded and a new attempt is made. Difficulty grows day-to-day in a week, the file and branch naming is fixed.
The solver uses breadth-first search over the state space. Each state consists of the git graph configuration, the set of collected files, and the command history. States are deduplicated by hashing the branch tips, HEAD position, and collected files. The first solution found is guaranteed to be optimal due to BFS properties. Every day, there should be a mechanism to guarantee that a valid puzzle is found.

Database Schema

The database uses Cloudflare D1 which is SQLite-based.

The users table stores user information with columns for user ID (the hashed identifier, primary key), username (nullable, for leaderboard display), created timestamp, and last active timestamp.
The games table stores game session records with columns for game ID (primary key), user ID (foreign key), puzzle ID, status (in progress, completed, or abandoned), commands used count, score, started timestamp, and completed timestamp.
The puzzles table stores puzzle definitions with columns for puzzle ID (primary key), puzzle date (for daily puzzles, nullable for archive puzzles), difficulty level, file targets as JSON, constraints as JSON, solution as JSON, and par score.
The leaderboard table stores daily leaderboard snapshots with columns for leaderboard date, user ID, rank, score, and games played. This is denormalized for fast reads.
The user stats table stores aggregated user statistics with columns for user ID (primary key), total games played, total games won, total commands used, best score, average score, current streak, and max streak.

Note: Indexes should be created on games by user ID for fetching user history, on games by puzzle ID for aggregating puzzle statistics, on leaderboard by date and rank for fast leaderboard queries, and on puzzles by date for daily puzzle lookup.
