# github-workflow-dashboard
<img width="1438" alt="Bildschirmfoto 2023-06-15 um 20 30 48" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/9cc02f36-1bb9-474c-a58b-76d9146c4cc8">

The dashboard aims to give an overview of an organisations current workflows and self-hosted runner infrastructure.

## Features
- Shows jobs in three states: queued, in progress, completed
- Detailed information can be viewed for queued and running jobs
- Overview of all jobs in the workflows tab
- Includes the GitHub status page to get a full overview in one place
- Shows an organisations self-hosted runners and their current status

## Screenshots
Workflow overview in the Workflows tab:

<img width="1435" alt="Bildschirmfoto 2023-06-15 um 20 51 16" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/8f6d8655-213d-4a4f-a7ed-8525be896d99">

Detailed view for jobs in progress:

<img width="1439" alt="Bildschirmfoto 2023-06-15 um 20 46 04" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/b25283cb-1488-4c2c-a517-7694053740e3">

Detailed view for queued jobs (mock data shows very long queue times):

<img width="1438" alt="Bildschirmfoto 2023-06-15 um 20 15 37" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/76efb2fe-ee04-4ae6-9ec0-1a4ade819e43">

GitHub status page:

<img width="1445" alt="Bildschirmfoto 2023-06-15 um 20 16 25" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/9cb572a4-99aa-4274-acaf-f684ec319d48">

## Dashboard Setup
The backend is a python flask application that accepts an incoming webhook from github, writes the data to a postgres database and makes the data available on an API endpoint to be consumed by the frontend.
The frontend is a react application that consumes the backend API.

As the 'queued' status is not available in the API, GitHub webhook events are used.
This allows to calculate queue times for jobs to find bottlenecks in your infrastructure.

### backend, frontend and db
- ORG_NAME=my-org
- ACCESS_TOKEN=myadmintoken
- GITHUB_WEBHOOK_SECRET=mywebhooksecret

ACCESS_TOKEN must have organization admin rights (This is a personal access (oauth) token from an org admin).
GITHUB_WEBHOOK_SECRET can be set when creating the webhook in GitHub, see below section about the webhook setup.

The docker-compose file from the setup directory can be used afer adding your github organisation name and access token:
```
version: '2.1'
services:

  backend:
    image: ngroyal/github-workflow-dashboard-backend:latest
    container_name: backend
    ports:
      - 3100:3100
    environment:
      - ORG_NAME=
      - ACCESS_TOKEN=
      - GITHUB_WEBHOOK_SECRET=
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=github
      - POSTGRES_PORT=5432
    depends_on:
      db:
        condition: service_healthy

  frontend:
    image: ngroyal/github-workflow-dashboard-frontend:latest
    container_name: frontend
    ports:
      - 3000:3000

  db:
    image: postgres
    ports:
      - 5432:5432
    restart: always
    user: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=github
    volumes:
      - ./pgdata:/var/lib/postgresql/data
```
Of course you can use an existing postgres database or run it on a different port.
For development, you will probably know how to run the services locally.

The frontend will then be available on http://localhost:3000 - make it accessible as you please!

### GitHub Webhook setup and Organisation access
Create a webhook on organization level with the following details, replacing your Payload URL with your webserver URL (note that the backend is expecting incoming requests on "/webhook", so whatever you use here, your webserver needs to map it to /webhook on the backend application). Don't forget to set a secret and pass it into the backend application as an environment variable later:

<img width="947" alt="Bildschirmfoto 2023-06-16 um 12 41 23" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/d7e6b457-e244-468a-9c26-5355be4a0601">

You only need the Workflow Jobs events:

<img width="346" alt="Bildschirmfoto 2023-06-15 um 21 14 57" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/61c2e2b7-c3be-432a-b05a-e975de907add">

## Security
The biggest concern is opening the backend to receive the webhook events from github. Thus, the /webhook endpoint is protected by receiving a secret token from the github webhook payload and verifying that the correct header is sent. Compare https://docs.github.com/en/webhooks-and-events/webhooks/securing-your-webhooks.

That's it!

## Planned features / improvements
- Queued jobs status should be checked by the frontend application regularily as the webhook or API can have hickups, e.g. due to network connectivity. Currently jobs can be stuck in their status forever and the db needs to be cleaned up manually.
- More math: Having all workflow history in the database means there is potential for a lot of insights. Top 5 repositories, most run workflows, longest taking jobs, longest waiting runners per tag etc.
