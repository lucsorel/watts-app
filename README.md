A sample application demonstrating how big data and connected objects can help energy monitoring.

The application models a basic `factory` which is monitored by different probes, whose approximative values are aggregated in a map-reduce manner to provide an estimation of the factory temperature evolution.

# Installation
* this project runs a NodeJS backend. Version 4.2.2 was used. It can installed easily on Linux systems with:
```bash
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -
sudo apt-get install nodejs
```
When upgrading from an older version (check with `nodejs --version`), remove ``nodejs`` and ``npm`` beforehand:
```bash
sudo apt-get purge nodejs npm
```

* then clone this repository (`git clone https://github.com/lucsorel/watts-app.git`)
* install the dependencies with `npm i`
* start the web server with `npm start`
* load the application in your browser at [http://localhost:3030/](http://localhost:3030/)

Unit tests can be run with `npm test`.

# Modeling
The factory and its heat sources are modeled in a very rudimentary way. Its purposes is to create a dynamic temperature environment which will be monitored blindly by the probes.

## Heat source
A `heat source` (like a heating system, a furnace, an hydraulic press) is characterized by:
* a `contribution temperature`: the maximum heat it brings to its environment. For example, we can assume a heating system will increase the temperature of its environment by 10°C max
* an `inertia duration`: the time (in hours) it takes for the heating system to be at its contribution temperature. In the same manner, this duration is used to estimate the decay of the contributed heat once the source is tuned off
* `activity` periods: laps of time (between a `start` and an `end` hours) during which the source is on

The effects of overlapping activities (for the same heat source) adds up to simulate the contribution of different heaters.

## Factory
A factory is characterized by:
* an `idle temperature`, which is the temperature without any heat source
* the `heat sources` installed in the factory, each one weighted by its relative contribution. For example, a furnace can be installed in the factory with a contribution heat of 20°c, but this heat will be weighted by 0.25 if we want to model that the furnace affects only 25% of the factory temperature
