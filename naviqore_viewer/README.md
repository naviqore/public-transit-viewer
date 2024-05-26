# NAVIQORE Streamlit App

## Setup

### Install dependencies

Run the command `poetry install` in your terminal to create a virtual environment with all requirements installed.

### Configuration

Create a `.env` file in the root directory. And add a line telling the application to which service host it should connect. In Local Development this is typically a Java Spring service running on `http://localhost:8080`.

The required line in the `.env` file will then be: `NAVIQORE_HOST_URL=http://localhost:8080`

_Note: you can also specify the `NAVIQORE_HOST_URL` in your operating system environment._

## Starting the App

To start the app run following command in your terminal from the root directory: `streamlit run naviqore_viewer/main.py`. _Note: The virtual environment should be active in your terminal session before starting the app._

## Naviqore Client
For development purposes the dependency to the Naviqore Client is currently set as `develop=true` in the `pyproject.toml` file, this allows updating the local copy of Naviqore Client (same git repository) without having to re-install the package after every change (by means of symbolic links). A limitation however is that the IDE (at least Visual Studio Code) does not recognize the package in this configuration for linting, as a workaround the relative path has been added to the `.vscode/settings.json` file. This approach is hacky and needs to be undone, when the `naviqore_client` package becomes stable.