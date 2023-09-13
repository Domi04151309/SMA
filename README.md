![Icon](https://raw.githubusercontent.com/Domi04151309/SMA/main/public/images/icons8-home.svg)

# Solar Power Visualization (DE)

Welcome to the **Solar Power Visualization** repository!
This software project is designed to effortlessly gather real-time data from
your solar roof system and present it on a user-friendly web page.
This repository contains an Express server that serves as both a backend and a
frontend. It provides various API endpoints and requires configuration settings
that are managed through a config file. This document will guide you through the
setup, configuration, and usage of the project.

## Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/download)
- [npm (Node Package Manager)](https://nodejs.org/en/download)

### Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/Domi04151309/SMA.git
   cd SMA
   ```

2. Install the project dependencies:

   ```bash
   npm install
   ```

### Configuration

Create an `inverters.json` file in a text editor and set the required
configuration values:

```javascript
[
  {
    "address": "192.168.XXX.XXX",
    "group": "usr",
    "password": ""
  },
  ...
]
```

## Usage

To start the Express server, run the following command:

```bash
npm start
```

This will start the server and make it available at http://localhost:3000/.

## API Endpoints

The project provides the following API endpoints:

- **GET /api/devices**: Returns a list of devices. See
  [`DevicesResponse`](https://domi04151309.github.io/SMA/interfaces/types.DevicesResponse.html).
- **GET /api/exact?start=[start]&end=[end]**: Returns a list of collected data points. See
  [`NowResponse`](https://domi04151309.github.io/SMA/interfaces/types.NowResponse.html).
- **GET /api/history**: Returns a list of collected data points. See
  [`NowResponse`](https://domi04151309.github.io/SMA/interfaces/types.NowResponse.html).
- **GET /api/licenses**: Returns all licenses.
- **GET /api/now**: Returns the latest data point. See
  [`NowResponse`](https://domi04151309.github.io/SMA/interfaces/types.NowResponse.html).
- **GET /api/settings**: Returns settings. (accessible only from private networks)
- **PUT /api/settings**: Updates settings. (accessible only from private networks)
- **GET /api/weather**: Returns todays weather. See
  [`WeatherResponse`](https://domi04151309.github.io/SMA/interfaces/types.WeatherResponse.html).

For more detailed information about each endpoint, refer to the source code and
the available [diagrams](https://github.com/Domi04151309/SMA/blob/main/docs/).

## Configuration

The configuration for the project is managed through the
[`config.js`](https://github.com/Domi04151309/SMA/blob/main/src/config.js) file.
Make sure to set the necessary values in this file before starting the server.

## Contributing

Contributions are welcome! If you'd like to contribute to the project, please
follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Submit a pull request detailing your changes.

## Third-Party Resources
- [Icons8](https://icons8.com/)
