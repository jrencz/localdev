# 0.1.0

Initial release

## Features

- `rc` is used for configuring localdev from now on which means its
  configuration can be expressed both in a particular project (when localdev
  is a dependency of the project) and somewhere above the project’s directory
  (in case is’t installed globally so that projects have no knowledge of its
  existence). rc allows ini and json syntax but json is a syntax of choice:
  you’re free to try using ini but all examples are expressed in json and
  features are currently developed with json syntax in mind.
- projects that can be linked are no longer obliged to implement any npm
  scripts to be runnable by localdev. It’s possible to run any shell script
  as linked dependency hook. It’s expressed in `.localdevrc` what script is
  run. npm scripts are promoted syntactically.
- scopes feature allow grouping localdev configuration.
- if no scope is given scope is set to the path where localdev executable
  (either `link` or `start`) is called
- configuration reference has been added to README.md
- some eye-pleasing CLI colors were added
