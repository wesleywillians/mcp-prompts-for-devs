# Docker Hub Configuration for CI/CD

To ensure the Docker image publication workflow works correctly, you need to configure the following secrets in your GitHub repository:

## Required Secrets

1. **DOCKERHUB_USERNAME**
   - Your Docker Hub username

2. **DOCKERHUB_TOKEN**
   - An access token for Docker Hub (don't use your password directly)

## How to Create a Docker Hub Token

1. Log in to your Docker Hub account: https://hub.docker.com
2. Click on your username in the top right corner and select "Account Settings"
3. In the sidebar menu, click on "Security"
4. Under "Access Tokens", click on "New Access Token"
5. Give your token a name (e.g., "GitHub Actions") and select the permission level (usually "Read & Write")
6. Click "Generate" and copy the generated token

## How to Add Secrets to GitHub

1. In your GitHub repository, go to "Settings"
2. In the sidebar menu, click on "Secrets and variables" then "Actions"
3. Click on "New repository secret"
4. Add the secrets:
   - Name: `DOCKERHUB_USERNAME`, Value: your username
   - Name: `DOCKERHUB_TOKEN`, Value: the token generated in the previous step

## Version Control Strategy

This project uses a strict version control strategy to prevent accidental overwrites:

1. **CI checks existing versions**: 
   - The CI workflow will check if the version in package.json already exists on Docker Hub
   - If the version exists, the CI workflow will fail, preventing the PR from being merged
   - This ensures you must update the version in package.json before merging to main

2. **Unique version tags**:
   - Every image gets a unique tag in the format `{base_version}-{commit_hash}`
   - Example: `1.0.0-a7f3e2d`
   - This ensures each build can be traced back to the exact commit

3. **When to update the version**:
   - For minor changes/fixes: No need to update, as the unique commit hash will differentiate the images
   - For significant changes: Update the version in package.json to indicate a meaningful new release

## How Versioning Works

1. The base version is taken from package.json
2. Each CI run checks if that base version already exists in Docker Hub
3. Each successful push to main creates:
   - A tag with the base version (if it doesn't exist yet)
   - A unique tag with the commit hash (always)
   - Updates the "latest" tag

## Verification

After configuring the secrets, any push to the main branch will automatically trigger the `docker-publish.yml` workflow, which will:

1. Run the tests
2. Generate version tags 
3. Log in to Docker Hub with your credentials
4. Build the Docker image
5. Push the image to Docker Hub with the generated tags

## Security Notes

- Never store your credentials directly in the code
- Periodically review access tokens and revoke unused ones
- Consider using tokens with limited scope and expiration time for greater security 