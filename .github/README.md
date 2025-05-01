# CI/CD Pipeline

This project uses GitHub Actions to run a continuous integration and delivery pipeline that is triggered in various scenarios.

## CI Flow

The CI flow performs the following steps and is triggered on pull requests:

1. **Version check**
   - Checks if the version in package.json already exists on Docker Hub
   - Prevents PRs with duplicate versions from being merged
   - Ensures proper versioning of Docker images

2. **Building a Docker image for testing**
   - Uses the dedicated Dockerfile.test
   - Includes all development dependencies to run tests
   - Builds a Docker image for testing

3. **Running tests inside the container**
   - Runs Jest tests inside the testing Docker container
   - Verifies all tests pass

4. **Building the production Docker image**
   - Uses the main Dockerfile of the project
   - Verifies the image can be built without errors

5. **Verifying the production image**
   - Starts the production Docker container
   - Checks if the container starts correctly
   - Ensures the Dockerfile is packaging the application correctly

## CD Flow

The CD flow is triggered on pushes to the main branch:

1. **Testing**
   - Runs the same tests as the CI flow to ensure quality

2. **Versioning**
   - Generates unique version tags using package.json version and commit hash
   - Verifies if base version tag already exists in Docker Hub

3. **Publishing to Docker Hub**
   - Builds the Docker image
   - Pushes the image to Docker Hub with appropriate tags:
     - `latest` tag
     - Unique version tag with commit hash (e.g., `1.0.0-a7f3e2d`)
     - Base version tag (only if it doesn't already exist)

## Benefits

- Ensures tests are run in a consistent environment
- Verifies the Dockerfile is configured correctly
- Ensures the application can run in a Docker container
- Prevents dependency or configuration issues before merging to main
- Automatically publishes production-ready images to Docker Hub
- Enforces proper version control for Docker images

## Configuration

- The CI flow is configured in the `.github/workflows/ci.yml` file
- The CD flow is configured in the `.github/workflows/docker-publish.yml` file
- Docker Hub secrets configuration is documented in `.github/DOCKERHUB.md` 