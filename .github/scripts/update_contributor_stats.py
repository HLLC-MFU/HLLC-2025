#!/usr/bin/env python3
"""
update_contributor_stats.py

This script updates the contributor statistics in the README.md file.
It fetches commit and PR statistics from the GitHub API and updates the badges
and contribution percentages in the README.md file.

Author: Nimit Tanboontor
"""

import os
import re
import subprocess
import requests
import json
import matplotlib.pyplot as plt
from datetime import datetime

# Configuration
REPO_OWNER = "HLLC-MFU"
REPO_NAME = "HLLC-2025"
README_PATH = "README.md"

# Map of GitHub usernames to display names
CONTRIBUTORS = {
    "jemiezler": "Nattawat Nattachanasit",
    "6531503042": "Nimit Tanboontor",
    "poonyawat0511": "Poonyawat Khomlek",
    "klavivach": "Klavivach",
    "aboutblank0000000": "ABOUTBLANK"
}

def run_command(command):
    """Run a shell command and return the output"""
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    stdout, stderr = process.communicate()
    return stdout.decode('utf-8').strip()

def get_commit_count(username):
    """Get the number of commits by a user using git command"""
    cmd = f'git log --author="{username}" --oneline | wc -l'
    return int(run_command(cmd))

def get_pr_count(username):
    """Get the number of PRs by a user using GitHub API"""
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("Warning: GITHUB_TOKEN not set. Using local git command for PR count.")
        return 0
    
    headers = {'Authorization': f'token {token}'}
    url = f'https://api.github.com/search/issues?q=repo:{REPO_OWNER}/{REPO_NAME}+author:{username}+type:pr'
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['total_count']
    else:
        print(f"Error fetching PRs for {username}: {response.status_code}")
        return 0

def get_total_commits():
    """Get the total number of commits in the repository"""
    cmd = 'git rev-list --count HEAD'
    return int(run_command(cmd))

def update_readme(stats):
    """Update the README.md file with the new statistics"""
    with open(README_PATH, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Update the badges and percentages for each contributor
    for username, data in stats.items():
        # Update commit badge
        commit_pattern = re.compile(f'<img src="https://img\\.shields\\.io/badge/Commits-\\d+-blue\\?style=for-the-badge"/>.*?{username}')
        content = re.sub(commit_pattern, f'<img src="https://img.shields.io/badge/Commits-{data["commits"]}-blue?style=for-the-badge"/>', content)
        
        # Update PR badge
        pr_pattern = re.compile(f'<img src="https://img\\.shields\\.io/badge/PRs-\\d+-green\\?style=for-the-badge"/>.*?{username}')
        content = re.sub(pr_pattern, f'<img src="https://img.shields.io/badge/PRs-{data["prs"]}-green?style=for-the-badge"/>', content)
        
        # Update percentage
        percentage_pattern = re.compile(f'<b>\\d+(\\.\\d+)?% of total contributions</b>.*?{username}')
        content = re.sub(percentage_pattern, f'<b>{data["percentage"]}% of total contributions</b>', content)
    
    # Update the total commits in the mermaid chart
    total_pattern = re.compile('title Total Commits: \\d+')
    content = re.sub(total_pattern, f'title Total Commits: {stats["total_commits"]}', content)
    
    # Update the mermaid chart values
    for username, name in CONTRIBUTORS.items():
        if username in stats:
            pattern = re.compile(f'"{name}" : \\d+')
            content = re.sub(pattern, f'"{name}" : {stats[username]["commits"]}', content)
    
    with open(README_PATH, 'w', encoding='utf-8') as file:
        file.write(content)

def main():
    """Main function to update contributor statistics"""
    print("Fetching contributor statistics...")
    
    # Get total commits
    total_commits = get_total_commits()
    
    # Initialize stats dictionary
    stats = {"total_commits": total_commits}
    
    # Get statistics for each contributor
    for username in CONTRIBUTORS.keys():
        commits = get_commit_count(username)
        prs = get_pr_count(username)
        
        percentage = 0
        if total_commits > 0:
            percentage = round((commits / total_commits) * 100, 2)
        
        stats[username] = {
            "commits": commits,
            "prs": prs,
            "percentage": percentage
        }
        
        print(f"{username}: {commits} commits, {prs} PRs, {percentage}% contribution")
    
    # Update the README
    update_readme(stats)
    print("Updated README.md with new statistics.")

if __name__ == "__main__":
    main() 