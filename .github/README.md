# CI/CD Pipeline

This project uses GitHub Actions to run a continuous integration flow that is triggered when:
- Pushing to the main branch
- Creating any Pull Request (PR), regardless of the target branch

## CI Flow

The CI flow performs the following steps:

1. **Building a Docker image for testing**
   - Creates a temporary Dockerfile specific for testing
   - Includes all development dependencies to run tests
   - Builds a Docker image for testing

2. **Running tests inside the container**
   - Runs Jest tests inside the testing Docker container
   - Verifies all tests pass

3. **Building the production Docker image**
   - Uses the main Dockerfile of the project
   - Verifies the image can be built without errors

4. **Verifying the production image**
   - Starts the production Docker container
   - Checks if the container starts correctly
   - Ensures the Dockerfile is packaging the application correctly

## Benefits

- Ensures tests are run in a consistent environment
- Verifies the Dockerfile is configured correctly
- Ensures the application can run in a Docker container
- Prevents dependency or configuration issues before merging to main

## Configuration

The CI flow is configured in the `.github/workflows/ci.yml` file. 