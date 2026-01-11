# Birthday Notification API

Birthday Restful API designed to schedule and send birthday notifications to users based on their local timezone.

## Features

- **User Management**: REST API to create and manage users with strict validation.
- **Smart Scheduler**: Cron-based scheduler that identifies users having birthday today at 9 AM (local time).
- **Reliable Queueing**: Uses **BullMQ** (Redis) for job processing, ensuring notifications are queued and processed asynchronously.
- **Resilience**:
  - **Exponential Backoff**: Autommatic retries for failed jobs (1s, 2s, 4s, 8s, Stop).
  - **Error Handling**: Smart differentiation between failed retries (500/Timeout) and permanent failures (400 Bad Request).
  - **Recovery**: On startup, checks for missed notifications and re-queues them.
- **Timezone Aware**: Respects `timezone` field for each user.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v20 or later)
- **Pnpm** (Preferred package manager)
- **MongoDB** (Database)
- **Redis** (Required for Job Queue)

## Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yuarsa/birthday-notif.git
    cd birthday-notif
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Configure Environment**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your Mongo and Redis credentials:
    ```env
    MONGO_URI=mongodb://localhost:27017/birthday_notif
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

## Running the Project

Make sure MongoDB and Redis services are running locally or accessible via config.

```bash
# development mode (auto-reload)
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Running with Docker

The easiest way to run the application is using Docker. This will automatically set up the API, MongoDB, and Redis.

1.  **Build and Run**

    ```bash
    docker-compose up -d --build
    ```

2.  **Access the Application**
    The API will be available at `http://localhost:4000/api/v1`.

3.  **View Logs**

    ```bash
    docker-compose logs -f app
    ```

4.  **Seed Data (Optional)**
    You can run the seeder inside the container:

    ```bash
    docker-compose exec app pnpm run db:seed
    ```

5.  **Stop Containers**
    ```bash
    docker-compose down
    ```

## API Endpoints

The API is available at `http://localhost:4000/api/v1`.
You can import `BirthDay-Service-Collection.json` into Postman for easy testing.

### Auth

- **Login**
  - `POST /v1/auth/login`
  - Body:
    ```json
    {
      "email": "admin@app.com",
      "password": "Password123!"
    }
    ```

### Users

- **List Users**
  - `GET /v1/users`
  - _Requires Bearer Token_

- **Create User**
  - `POST /v1/users`
  - _Requires Bearer Token_
  - Body:
    ```json
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "password": "Password123!",
      "dateOfBirth": "1990-01-01",
      "location": "Indonesia",
      "timezone": "Asia/Jakarta"
    }
    ```

- **Get User Detail**
  - `GET /v1/users/:userId`
  - _Requires Bearer Token_

- **Update User**
  - `PUT /v1/users/:userId`
  - _Requires Bearer Token_
  - Body:
    ```json
    {
      "firstName": "John Updated",
      "lastName": "Doe"
    }
    ```

- **Delete User**
  - `DELETE /v1/users/:userId`
  - _Requires Bearer Token_

### Scheduler (Testing)

- **Manual Trigger**
  - `POST /v1/scheduler/trigger`
  - Body:
    ```json
    {
      "type": "BIRTHDAY",
      "hour": 9
    }
    ```

## Seeding Data

To populate the database with dummy users for testing:

```bash
pnpm run db:seed
```

To refresh the database (drop and re-seed):

```bash
pnpm run db:fresh
```

## Testing

The project includes comprehensive unit tests regarding the scheduler and processor logic.

```bash
# unit tests
pnpm run test

# test coverage
pnpm run test:cov
```

## Architecture

### Modules

- **UsersModule**: Handles user CRUD and repository logic.
- **SchedulerModule**: Runs cron jobs to find eligible users and push jobs to Queue.
- **NotificationsModule**: Consumes jobs from Queue and sends emails via `EmailProvider`.
- **RedisModule**: Global module managing BullMQ configuration.

### Deployment

- The worker processes jobs independently.
- Queue data persists in Redis for 24 hours after failure/completion.
- If an email fails with **400 Bad Request**, it is marked as `FAILED` immediately.
- If an email fails with **500** or **Timeout**, it is retried up to 5 times.
