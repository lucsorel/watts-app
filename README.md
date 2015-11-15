A sample application demonstrating how big data and connected objects can help energy monitoring.

The application models a basic `factory` which is monitored by different probes, whose approximative values are aggregated in a map-reduce manner to provide an estimation of the factory temperature evolution.

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
