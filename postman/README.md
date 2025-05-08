# HLLC Campus CRM API Postman Collection

This folder contains Postman collections and environments for testing the HLLC Campus CRM API.

## Folder Structure

- **collections/** - Contains the API request collections organized by module
- **environments/** - Contains environment variables for different deployment environments

## How to Use

1. Import the collections and environments into Postman:
   - Open Postman
   - Click "Import" button in the top left
   - Select the files from this folder to import

2. Select the environment:
   - After importing, select the "HLLC-Development" environment from the dropdown in the top right corner

3. Authenticate first:
   - Use the Auth/Login request to get your access token
   - The test script will automatically set the token in your environment variables

4. Use the other requests:
   - All requests with authentication will use the token from your environment
   - Many requests will automatically set IDs in your environment for chaining requests

## Request Flow

For typical usage, follow this order:

1. Auth/Login
2. Create or get a role (Roles)
3. Create a school (Schools)
4. Create a major (Majors)
5. Create a user (Users)
6. Create activities or other resources

## Variables

The following environment variables are used:

- `baseUrl` - The base URL of the API
- `accessToken` - JWT token for authentication
- `refreshToken` - Refresh token for getting new access tokens
- `userId` - The ID of the current user
- `schoolId` - The ID of a school
- `majorId` - The ID of a major
- `roleId` - The ID of a role

These variables are automatically set by test scripts when creating resources. 