# github-workflow-dashboard
![Bildschirmfoto 2023-06-30 um 23 44 37](https://github.com/Greuel/github-workflow-dashboard/assets/27424637/50c37d2b-dbb0-4791-92cf-f1f0d92d41ff)

The dashboard aims to give an overview of an organisations current workflows and self-hosted runner infrastructure.

## Features
- Shows jobs in three states: queued, in progress, completed
- Detailed information can be viewed for queued and running jobs
- Overview of all jobs in the workflows tab
- Includes the GitHub status page to get a full overview in one place
- Shows an organisations self-hosted runners and their current status
- Update button to check job status and update them accordinlgy using the GitHub api (required as jobs can get stuck in their state if webhooks fail from github to the backend)

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
      - POSTGRES_HOST=host.docker.internal
    depends_on:
      db:
        condition: service_healthy
    extra_hosts:
          - "host.docker.internal:172.17.0.1"

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

The frontend assumes that the user also has access to the backend api as it is doing client side requests.
Default URL for frontend to access the backend api: `${location.protocol}${process.env.PUBLIC_URL}/api`
The following endpoints need to be exposed from your webserver/proxy and be routed to the backend service:
- /workflows-completed-count
- /workflows-completed-count-by-repo
- /workflow_runs
- /queue
- /in_progress
- /completed
- /runners
- /update-workflow-status

Or, in other words (nginx example), assuming the dashboard will be available on https://example.com/workflow-dashboard and using defaults:
```
map $http_x_forwarded_for $block {
  # my allowed ip (e.g. company VPN)
  123.123.123.123              '';
  # default deny
  default                 1;
}

server {
    listen              443 ssl;
    server_name         example.com;
    # github workflow webhook
        location /github_webhook {
                proxy_pass http://localhost:3100/webhook;
        }
        # workflow API
        location /workflow-dashboard/api/queue {
                proxy_pass http://localhost:3100/queue;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/update-workflow-status {
                proxy_pass http://localhost:3100/update-workflow-status;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/workflows-completed-count {
                proxy_pass http://localhost:3100/workflows-completed-count;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/workflows-completed-count-by-repo {
                proxy_pass http://localhost:3100/workflows-completed-count-by-repo;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/in_progress {
                proxy_pass http://localhost:3100/in_progress;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/completed {
                proxy_pass http://localhost:3100/completed;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/runners {
                proxy_pass http://localhost:3100/runners;
                if ($block) {
                    return 403;
                }
        }
        location /workflow-dashboard/api/workflow_runs {
                proxy_pass http://localhost:3100/workflow_runs;
                if ($block) {
                    return 403;
                }
        }
        # workflow dashboard
        location /workflow-dashboard {
                proxy_pass http://localhost:3000;
                if ($block) {
                    return 403;
                }
        }
}
```


### GitHub Webhook setup and Organisation access
Create a webhook on organization level with the following details, replacing your Payload URL with your webserver URL (note that the backend is expecting incoming requests on "/webhook", so whatever you use here, your webserver needs to map it to /webhook on the backend application - from the example above this would be https://example.com/github_webhook). Don't forget to set a secret and pass it into the backend application as an environment variable later:

<img width="947" alt="Bildschirmfoto 2023-06-16 um 12 41 23" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/d7e6b457-e244-468a-9c26-5355be4a0601">

You only need the Workflow Jobs events:

<img width="346" alt="Bildschirmfoto 2023-06-15 um 21 14 57" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/61c2e2b7-c3be-432a-b05a-e975de907add">

## Security
The biggest concern is opening the backend to receive the webhook events from github. Thus, the /webhook endpoint is protected by receiving a secret token from the github webhook payload and verifying that the correct header is sent. Compare https://docs.github.com/en/webhooks-and-events/webhooks/securing-your-webhooks.

That's it!

## Planned features / improvements
- More math: Having all workflow history in the database means there is potential for a lot of insights. Top 5 repositories, most run workflows, longest taking jobs, longest waiting runners per tag etc.
