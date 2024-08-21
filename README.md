# Public Transit Viewer

Viewer to interact with the [Public Transit Service](https://github.com/naviqore/public-transit-service).

The streamlit based Python app allows users to query connections between two stops or generate isolines from a specific
stop. The application supports the query parameters of the service to search specific connections or isoline.

## Installation

Get the current release from pypi:

```sh
pip install public-transit-viewer
```

Or run the viewer inside a Docker container, pull the image:

TODO: Add instructions.

## Usage

### Configuration

Create a `.env` file in the root directory. And add a line telling the application to which service host it should
connect. In Local Development this is typically a Java Spring service running on `http://localhost:8080`.

The required line in the `.env` file will then be: `NAVIQORE_HOST_URL=http://localhost:8080`

**Note**: you can also specify the `NAVIQORE_HOST_URL` in your operating system environment.

## Starting the App

To start the app run following command in your terminal from the root directory:

`streamlit run naviqore_viewer/main.py`.

**Note:** The virtual environment should be active in your terminal session before starting the app.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.