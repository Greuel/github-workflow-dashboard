# github-workflow-dashboard
<img width="1438" alt="Bildschirmfoto 2023-06-15 um 20 30 48" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/9cc02f36-1bb9-474c-a58b-76d9146c4cc8">

The dashboard aims to give an overview of an organisations current workflows and self-hosted runner infrastructure.

## Features
- Shows jobs in three states: queued, in progress, completed
- Detailed information can be viewed for queued and running jobs
- Overview of all jobs in the workflows tab
- Includes the GitHub status page to get a full overview in one place
- Shows an organisations self-hosted runners and their current status

## Dashboard Setup
The backend is a python flask application that accepts an incoming webhook from github, writes the data to a postgres database and makes the data available on an API endpoint to be consumed by the frontend.
The frontend is a react application that consumes the backend API.

As the 'queued' status is not available in the API, GitHub webhook events are used.
This allows to calculate queue times for jobs to find bottlenecks in your infrastructure.

# backend, frontend and db
- ORG_NAME=my-org
- ACCESS_TOKEN=myadmintoken

ACCESS_TOKEN must have organization admin rights.

Just run the docker-compose file from the setup directory afer adding your github organisation name and access token.
For development, you will probably know how to run the services locally.

# GitHub Webhook and Organisation access
Create a webhook on organization level with the following details, replacing your Payload URL with your webserver URL (note that the backend is expecting incoming requests on "/webhook", so whatever you use here, your webserver needs to map it to /webhook on the backend application)

<img width="965" alt="Bildschirmfoto 2023-06-15 um 21 14 42" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/5de49213-20d5-4e46-89ed-ba9e0f2ea60f">

You only need the Workflow Jobs events:
<img width="346" alt="Bildschirmfoto 2023-06-15 um 21 14 57" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/61c2e2b7-c3be-432a-b05a-e975de907add">

# Security
The biggest concern is opening the backend to receive the webhook events from github. The endpoint should be protected thruogh a webserver of your choice by sending a secret with the webhook payload. Compare https://docs.github.com/en/webhooks-and-events/webhooks/securing-your-webhooks.

That's it!

## Screenshots
Workflow overview in the Workflows tab:

<img width="1435" alt="Bildschirmfoto 2023-06-15 um 20 51 16" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/8f6d8655-213d-4a4f-a7ed-8525be896d99">

Detailed view for jobs in progress:

<img width="1439" alt="Bildschirmfoto 2023-06-15 um 20 46 04" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/b25283cb-1488-4c2c-a517-7694053740e3">

Detailed view for queued jobs:

<img width="1438" alt="Bildschirmfoto 2023-06-15 um 20 15 37" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/76efb2fe-ee04-4ae6-9ec0-1a4ade819e43">

GitHub status page:

<img width="1445" alt="Bildschirmfoto 2023-06-15 um 20 16 25" src="https://github.com/Greuel/github-workflow-dashboard/assets/27424637/9cb572a4-99aa-4274-acaf-f684ec319d48">

## Planned features / improvements
- Queued jobs status should be checked by the frontend application regularily as the webhook or API can have hickups, e.g. due to network connectivity. Currently jobs can be stuck in their status forever and the db needs to be cleaned up manually.
- More math: Having all workflow history in the database means there is potential for a lot of insights. Top 5 repositories, most run workflows, longest taking jobs, longest waiting runners per tag etc.
