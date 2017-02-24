#localdev

Tool for configuration-driven automated npm link

## Aim and scope of the project

`npm` itself provides a way to symlink any directory into `node_modules` of any
packages: `npm link`

This method, however vary simple, yet powerful, is not the most comfortable
to use primarily because it's a 2-step process

// TODO: describe how to use `npm link` directly

The aim of `localdev` is to allow rc-alike configuration layer over the built-in
`npm link` mechanism.

## Rationale

The intention was to create a tool that will allow building complex
applications as bundles of independently-released packages instead of having
to maintain a several monolithic God-packages and optionally depending on
VCS solutions to share common modules across them.

The primary use case is building a set of independently-developed application
which share a set of common UI components, but the solution is suitable for
Node-only applications as well.

Linking locally maintained working copies of otherwise regularly published
modules makes the experience of developing a multi-package app more like it
was a monolith without the downsides of monolithic architecture.

### Hooks

Since UI components are rarely simple JS packages they often require some kind
of build process, which parts are not distributed as part of the package (in
other words: build process elements are `devDependencies`).

What is a correct approach for publishing (one should not make `babel` or
`node-sass` a dependency of carousel component written in ES6 + sass) makes
the dependency package installed with npm virtually impossible to develop
along with the application which uses it.

This is not a huge inconvenience for most of the projects ()

## Config reference

```json
{
    // `dependencies` key
    //
    // Contains entries about placement of packages which should be linked.
    "dependencies": {
      
        // `<package name>` key
        //
        // Holds configuration related to the package that should be linked.
        "package-name": <string|null|false|Object>,
      
        // `<package name>` key: String, relative path
        //
        // path relative to the place where .localdevrc is placed
        "package-name": "../my-package-dir",
        
        // `<package name>` key: String, absolute path
        "package-name": "/Volumes/packages/my-package-dir",
      
        // `<package name>` key: null
        //
        // This will unlink the package (i.e. will reinstall it normally if it's
        // linked) next time `localdev-link` is run.
        // Package will remain installed (i.e. it will not be linked) each
        // time `localdev-link` is run.
        // It's a way to remporarily re-install a package OR to override
        // general configuration from within a scope.
        "package-name": null,
        
        // `<package name>` key: false
        //
        // This will omit the dependency when linking leaving it as it no matter
        // if it should be installed or linked.
        "package-name": false,
        
        // `<package-name>` key: object
        //
        // This is the most verbose dependency configuration form
        //
        // `strategy` may be omitted in certain cases:
        // - if `path` is present strategy will be `link`
        "package-name": {
            "strategy": "link",
            "path": "/Volumes/packages/my-package-dir"
        }
    }
   
    // `hooks` key
    //
    // Allows expressing commands to be run in linked packages' directories
    // May be used to start build process.
    //
    // Using npm scripts is deliberately promoted syntactically as scripts are
    // by design meant to be the public API of a package.
    //
    // All examples in this section describe the same hook
    "hooks": {
        // `<package name>` key
        //
        // Holds hook configuration related to the package that should be
        // linked. Please refer to `commonHook` key for value documentation.
        "package-name": <string|Array|Object>,
        
        // `<package name>` key: string
        //
        // Is interpreted as a name of npm script in the linked module.
        // It's meant to be shorthand syntax - no furher configuration
        // may be expressed this way. 
        "package-name": "start",
        
        // `<package name>` key: Array
        //
        // Is interpreted as arguments of [ChildProcess.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
        // This is also a way to pass options if npm script should be run.
        //
        // Note: `cwd` options will be set to the root of linked module
        // (absolute path). It MAY be overridden by setting providing `cwd` key
        // in 3rd array element.
        "package-name": ["npm", ["run", "start"], {}],
        
        // `<package name>` key: object
        //
        // This is the most verbose hook configuration form
        // It allows defining verbosity for each hook.
        //
        // `strategy` may be omitted in certain cases:
        // - if `spawnArgs` is present strategy will be `spawn`
        "package-name": {
          "strategy": "spawn",
          "spawnArgs": ["npm", ["run", "start"], {}],
          "isVerbose": "false"
        }
    }
    
    // `environments` key
    //
    // Allows scoping configuration by arbitrary name or by path (absolute or
    // relative - conditions apply for relative paths).
    //
    // All the configuration keys described on the configuration root level
    // apart from this key may be expressed under any valid key inside `scopes`.
    //
    // To allow arbitrary names more strict rules apply to what "relative path"
    // is. It's a string starting with either `./` or `../` or a string having
    // `/` in it (but not as a first character). This effectively disallows
    // expressing relative paths being direct descendant child (without path
    // separator) which is valid in terms of node standard library. Such paths
    // are required to start with `./` to be interpreted as relative paths.
    "scopes": Object.<string, object>
}
```

## Scopes

Scopes can be either arbitrary names (if they start with any character but `/`
or `./`) or paths. Arbitrary names may be useful for expressing general-purpose
scopes (see [Use cases](#use-cases)) while paths may be used to override a piece
of configuration in a `.localdevrc` file placed above the path in question
without a need to express a `.localdevrc` inside the project root itself.
All relative paths will be resolved to absolute before choosing configuration.

Currently only one scope may be expressed during `localdev-link` call for
simplicity of implementation.

If `localdev-link` is run without a scope expressed (via `--scope`) then it's
run with implied scope of the root of the npm project it's run inside (as in
[`find-root`](https://www.npmjs.com/package/find-root)).

All path scopes are normalised which means:
1) relative paths are turned to absolute (from the dirname of where thr rc file
was found)
2) absolute paths are clipped to the root of npm module (i.e. directory in
which the package.json) they point at.

## Configuration precedence

On the very basic level of where configuration is stored [`rc`](https://github.com/dominictarr/rc/blob/master/README.md)
rules apply.
After the configuration is resolved by `rc` the precedence for linking
instructions is as follows
- dependency expressed in `dependencies` inside a scope
- dependency expressed in root-level `dependencies`

## Use cases

### "Developing a package along with projects"

As a developer of some NPM package which I also use as a dependency of my
other projects I'd like to be able to use working copy of my package in
all of them because that's why I get to know what's there to be added.
I express where my package is placed on my machine in `~/.locldevrc` so it
applies anywhere:
    
```json
{
    "dependencies": {
        "my-package": "./my-package-working-copy-path"
    }
}
```

### "Using fixed version somewhere"
    
I'm happy with using the working copy in most of the projects but I
need to use released version of my package in some of them (as
described in appropriate `package.json` files in projects). I don't
want to add a separate `.localdevrc` to each of them.

I define a scope named "fixed-deps" and I change the part of localdev
configuration which is not right for those kinds of projects.

```json
{
    "dependencies": {
        "my-package": "./my-package-working-copy-path"
    },
    "scopes": {
        "fixed-deps": {
            "dependencies": {
                "my-package": null
            }
        }
    }
}
``` 

### "Using fixed version sometimes"
    
I'm happy with using the working copy of my package as a dependency 
most of the time but I'd like to run acceptance tests using released
version only to make sure I don't depend on some feature of my package
I haven't published yet.

I may modify a part of the configuration using CLI:

// TODO: describe CLI

Or I may use a scope and pass the scope name via CLI
so this scope is used.

// TODO: describe CLI

Either way I need to call:
- `localdev-link` with appropriate arguments before tests (this will run
`npm link` and/or `npm install` where needed according to the configuration)
- command that runs tests
- `localdev-link` without tests-specific configuration arguments to restore
the project to a working copy state.

### "I develop a fix for my OSS dependency which I will then file a PR for"

Being an active member of the open source community along with my normal day
job I sometimes bump into some bugs in projects I use as dependencies. I'd like
not only to develop a fix which I'll check against dependency's own test suite
but I'd also like to run test suites of all my apps that depend on it. 