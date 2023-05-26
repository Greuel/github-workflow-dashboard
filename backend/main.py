import requests
import json
from datetime import datetime, timedelta
import argparse
import functions

# Replace with your GitHub access token and organization name
ACCESS_TOKEN = 'myaccesstoken'
ORG_NAME = 'myorg'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='GitHub Runner Stats', add_help=False)
    # parser.add_argument('--org', required=True, help='Organization name')
    parser.add_argument('--individual', action='store_true',
                        help='List run time for individual workflow runs.')
    parser.add_argument('--runners', action='store_true',
                        help='Get current runner status.')
    parser.add_argument('--repo', help='Repository name')
    parser.add_argument('--weekly', action='store_true',
                        help='Show weekly averages')
    parser.add_argument('--daily', action='store_true',
                        help='Show daily averages'),
    parser.add_argument('-h', '--help', action='store_true',
                        help='Show help message')
    args = parser.parse_args()

if args.help:
    functions.show_help()
    exit()

if not any(vars(args).values()):
    functions.show_help()
    exit()
# Set request headers with authorization token
headers = {
    'Authorization': f'token {ACCESS_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

if args.runners:
    # set runner URL
    runnerUrl = f"https://api.github.com/orgs/{ORG_NAME}/actions/runners"
    response = requests.get(runnerUrl, headers=headers)

    if response.status_code != 200:
        print(
            f"Failed to get runners for organization {ORG_NAME}. Status code: {response.status_code}")
        exit()

    runners = json.loads(response.text)

    for runner in runners["runners"]:
        print(f"Runner name: {runner['name']}")
        print(f"Runner status: {runner['status']}")
        print(f"Runner ID: {runner['id']}")
        print(f"Runner labels: {runner['labels']}\n")
        print("------------------------------------")
    exit()


if args.repo:
    # Fetch the specified repository
    response = requests.get(
        f'https://api.github.com/repos/{ORG_NAME}/{args.repo}', headers=headers)
    response.raise_for_status()
    repos = [response.json()]
else:
    # Fetch all repositories in the organization
    response = requests.get(
        f'https://api.github.com/orgs/{ORG_NAME}/repos', headers=headers)
    response.raise_for_status()
    repos = response.json()

    # Check if the request was successful
if response.status_code == 200:
    # Parse the response JSON data
    repos = json.loads(response.text)
    # Iterate over all pages of repositories returned by the API
    while 'next' in response.links.keys():
        # Send GET request to the next page of the API endpoint
        response = requests.get(response.links['next']['url'], headers=headers)
        # Parse the response JSON data and append it to the repos list
        repos.extend(json.loads(response.text))
    # Iterate over the repositories and fetch the workflow run times
    if args.repo:
        print(f"Processing {args.repo}")
        # GitHub API endpoint to retrieve workflow runs for the repository
        runs_url = f"https://api.github.com/repos/{ORG_NAME}/{args.repo}/actions/runs"
        # Send GET request to the API endpoint
        runs_response = requests.get(runs_url, headers=headers)
        # Check if the request was successful
        if runs_response.status_code == 200:
            # Parse the response JSON data
            workflow_runs = json.loads(runs_response.text)['workflow_runs']
            # Filter the workflow runs by status 'completed'
            completed_runs = [
                run for run in workflow_runs if run['status'] == 'completed']
            # Create an empty dictionary to store run times by week or day
            if args.weekly:
                run_times_by_period = {}
                period_duration = 7  # Days
            elif args.daily:
                run_times_by_period = {}
                period_duration = 1  # Day
            else:
                run_times_by_period = None
                period_duration = None
    else:
        for repo in repos:
          print(f"Processing {repo['name']}...")
          # GitHub API endpoint to retrieve workflow runs for the repository
          runs_url = f"https://api.github.com/repos/{ORG_NAME}/{repo['name']}/actions/runs"
          # Send GET request to the API endpoint
          runs_response = requests.get(runs_url, headers=headers)
          # Check if the request was successful
          if runs_response.status_code == 200:
              # Parse the response JSON data
              workflow_runs = json.loads(runs_response.text)['workflow_runs']
              # Filter the workflow runs by status 'completed'
              completed_runs = [
                    run for run in workflow_runs if run['status'] == 'completed']
              # Create an empty dictionary to store run times by week or day
          if args.weekly:
            run_times_by_period = {}
            period_duration = 7  # Days
          elif args.daily:
              run_times_by_period = {}
              period_duration = 1  # Day
          else:
              run_times_by_period = None
              period_duration = None

if args.weekly:
    # Iterate over the completed runs and calculate their run time
    for run in completed_runs:
        # Convert the created_at and updated_at timestamps to datetime objects
        created_at = datetime.strptime(run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
        updated_at = datetime.strptime(run['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
        # Calculate the run time in minutes
        run_time = int((updated_at - created_at).total_seconds() / 60)
        # Calculate the start of the week the run was completed in
        period_start = created_at.date() - timedelta(days=created_at.weekday())
        # Add the run time to the corresponding week
        if period_start in run_times_by_period:
            run_times_by_period[period_start].append(run_time)
        else:
            run_times_by_period[period_start] = [run_time]
    # Calculate the average run time for each week
    for period, run_times in run_times_by_period.items():
        avg_run_time = sum(run_times) / len(run_times)
        print(
            f"Average run time for {period} - {period + timedelta(days=period_duration - 1)}: {avg_run_time:.2f} minutes")

if args.daily:
    print(f"\nDaily average run times for the last 7 days:\n{'-' * 50}")
    end_date = datetime.utcnow().date() - timedelta(days=1)  # Exclude today
    start_date = end_date - timedelta(days=6)
    if args.repo:
        print(f"Repository: {args.repo}")
        # Fetch the completed workflow runs for the repository
        completed_runs_response = requests.get(
            f"https://api.github.com/repos/{ORG_NAME}/{args.repo}/actions/runs?status=completed&per_page=100", headers=headers)
        completed_runs_response.raise_for_status()
        completed_runs = completed_runs_response.json()['workflow_runs']
        run_times_by_day = {}
        for i in range(7):
            run_times_by_day[(end_date - timedelta(days=i)
                              ).strftime('%Y-%m-%d')] = []
        for run in completed_runs:
            # Convert the created_at and updated_at timestamps to datetime objects
            created_at = datetime.strptime(
                run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
            updated_at = datetime.strptime(
                run['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
            # Calculate the run time in minutes
            run_time = int((updated_at - created_at).total_seconds() / 60)
            # Check if the run was completed in the last 7 days
            if start_date <= created_at.date() <= end_date:
                run_times_by_day[created_at.strftime(
                    '%Y-%m-%d')].append(run_time)
        # Calculate the average run time for each day of the last 7 days
        for day, run_times in run_times_by_day.items():
            if run_times:
                avg_run_time = sum(run_times) / len(run_times)
                print(f"{day}: {avg_run_time:.2f} minutes")
            else:
                print(f"{day}: No workflow runs")
    else:
        for repo in repos:
            print(f"Repository: {repo['name']}")
            # Fetch the completed workflow runs for the repository
            completed_runs_response = requests.get(
                f"https://api.github.com/repos/{ORG_NAME}/{repo['name']}/actions/runs?status=completed&per_page=100", headers=headers)
            completed_runs_response.raise_for_status()
            completed_runs = completed_runs_response.json()['workflow_runs']
            run_times_by_day = {}
            for i in range(7):
                run_times_by_day[(end_date - timedelta(days=i)
                                  ).strftime('%Y-%m-%d')] = []
            for run in completed_runs:
                # Convert the created_at and updated_at timestamps to datetime objects
                created_at = datetime.strptime(
                    run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
                updated_at = datetime.strptime(
                    run['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
                # Calculate the run time in minutes
                run_time = int((updated_at - created_at).total_seconds() / 60)
                # Check if the run was completed in the last 7 days
                if start_date <= created_at.date() <= end_date:
                    run_times_by_day[created_at.strftime(
                        '%Y-%m-%d')].append(run_time)
            # Calculate the average run time for each day of the last 7 days
            for day, run_times in run_times_by_day.items():
                if run_times:
                    avg_run_time = sum(run_times) / len(run_times)
                    print(f"{day}: {avg_run_time:.2f} minutes")
                else:
                    print(f"{day}: No workflow runs")

if args.individual:
    # Iterate over the completed runs and print their run time
    if args.repo:
        for run in completed_runs:
            # Convert the created_at and updated_at timestamps to datetime objects
            created_at = datetime.strptime(
                run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
            updated_at = datetime.strptime(
                run['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
            # Calculate the run time in minutes
            run_time = int((updated_at - created_at).total_seconds() / 60)
            print(
                f"Run time for {run['name']} (ID: {run['id']}) Created at: {run['created_at']}: {run_time} minutes")
    else:
        for run in completed_runs:
            # Convert the created_at and updated_at timestamps to datetime objects
            created_at = datetime.strptime(
                run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
            updated_at = datetime.strptime(
                run['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
            # Calculate the run time in minutes
            run_time = int((updated_at - created_at).total_seconds() / 60)
            print(
                f"Run time for {run['name']} (ID: {run['id']})(Created at: {run['created_at']}) in {repo['name']}: {run_time} minutes")
