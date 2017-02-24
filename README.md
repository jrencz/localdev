## Config reference

```json5
{
  // `packages` key
  //
  // Contains entries about placement of packages which should be linked.
  "packages": {

    // `<package name>` key
    //
    // Holds configuration related to the package that should be linked.
    "my-awesome-package": <string|null|false>,

    // `<package name>` key: String, relative path
    //
    // path relative to the place where .localdevrc is placed
    "my-awesome-package": '../my-package-dir'

    // `<package name>` key: null
    //
    // This will unlink the package (i.e. will reinstall it normally) next
    // time `localdev-link` is run.
    // Package will remain installed (i.e. it will not be linked) each time
    // `localdev-link` is run.
    "my-awesome-package": null
    
    // `<package name>` key: false
    //
    // This will prevent hook from being run without unlinking.
    "my-awesome-package": false
  }

  // `commonHook`
  //
  // Defines common hook for projects
  "commonHook": <string|Array>,

  // `commonHook` key: String
  //
  // Is interpreted as a name of npm script in the linked module.
  // It's meant to be shorthand syntax - no furher configuration
  // may be expressed this way. 
  "commonHook": "localdev-link",

  // `hook` key: Array
  //
  // Is interpreted as arguments of [ChildProcess.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
  // This is also a way to pass options if npm script should be run.
  //
  // Note: `cwd` options will be set to the root of linked module
  // (absolute path). It MAY be overridden by setting providing `cwd` key
  // in 3rd array element.
  "commonHook": ["npm", ["run", "localdev-link"], {}]

  // `hooks` key
  //
  // Describes exceptions from what's described in `commonHook`
  //
  "hooks": {
  
    // `<package name>` key
    //
    // Holds hook configuration related to the package that should be linked.
    // Please refer to `commonHook` key for value documentation.
    "wonga-sliders-ng1-adapter": <string|Array>,
  }
  
  // `verboseHooks` key
  //
  // Allows enabling hook process stdout piping.
  // No colors there.
  "verboseHooks": <Array.<string>>
}
```