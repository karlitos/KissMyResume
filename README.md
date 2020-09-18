# KissMyResume

_[HackMyResume](https://github.com/hacksalot/HackMyResume) but [Keep it simple, (stupid)](https://en.wikipedia.org/wiki/KISS_principle)_. I really liked the original HackMyResume tool, but it lacked some important features, did not always provide the best results and I found the code base rather complicated. So I created my own version, strongly inspired by the HackMyResume project and the [resume-cli](https://github.com/jsonresume/resume-cli), but tried to __keep it simple__ by relying on off-the-shelf tools and libraries.

![Screencast](./screencast.gif)

The project is still WIP and in very early stage. It targets following shortcomings of the __HackMyResume__ [1] and __resume-cli__ [2] tools:
* missing support for asynchronous template rendering (1,2)
* PDF export relying on 3rd party tools (1)
* exported PDF looking differently than HTML printed as PDF (1)
* no support for local themes (2)

## Current status

To provide best support for the [broad variety of 3rd party themes](https://www.npmjs.com/search?q=jsonresume-theme) the [official release (0.0.0)](https://github.com/jsonresume/resume-schema/releases/tag/0.0.0) of Json-resume schema is supported and used for validation.

Since the version 1.0.0 there is a Desktop App build with [electron](www.electronjs.org) and [electron-forge](https://www.electronforge.io/) which is currently still in very early __beta__ stage. So far it allows to create resumes with a web-form generated automatically from the json-resume-scheme, allows to open and validate resumes in JSON format, render them and export in the same formats as the CLI. The GUI utilizes the CLI, so all the original functionality was preserved.

The App allows to download the jsonresume-themes from NPM automatically and use them for rendering. I can not guarantee, that all 3rd party themes will work, around 30-40 were tested with satisfactory results, so far a bunch of them had to be blacklisted. In a case a theme shall not work, please open an issue on Github.

### Currently supported in the CLI
 
* [x] CLI - implemented with the [Caporal.js](https://github.com/mattallty/Caporal.js) framework.
* [x] Support for resumes in [JSON-resume](https://jsonresume.org/) format
* [x] Support for [Json-resume themes](https://jsonresume.org/themes/) 
* [x] Export in all formats without the necessity for any 3rd party libraries/tools
* [x] Export to HTML
* [x] Export to PDF and PNG utilizing the [puppeteer](https://github.com/GoogleChrome/puppeteer) Headless Chrome Node API 
* [x] Export to DOCX with the [html-docx-js](https://github.com/evidenceprime/html-docx-js) library
* [x] Export to YAML with the [json2yaml](https://git.coolaj86.com/coolaj86/json2yaml.js) utility
* [x] Export to all formats at once
* [x] Resume validation (JSON-Resume, FRESH)
* [x] Empty resume initialization
* [x] Resume HTML live preview with hot-reload


### Desktop App
* [x] Resume forms (Electron App + live preview + [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form))
  * [x] Initial app built around react and react-jsonschema-form works
  * [x] Created app Tested on MacOs
  * [x] Allows to read json-resume data to the form
  * [x] Further integration with the CLI
  * [x] Split-pane with preview
  * [x] Theme support with possibility to download jsonresume-themes from NPM
  * [ ] Possibility to delete downloaded themes
  * [ ] Support for local themes
  * [x] Export of the rendered resume in ALL formats
  * [ ] Selecting formats for export
  * [ ] More mature GUI, improved styling

### To do

* [ ] Spellchecking [node-spellchecker](https://github.com/atom/node-spellchecker)
* [ ] Proof-Reading of the result [Proofreader](https://github.com/kdzwinel/Proofreader)
* [ ] Resume conversion  (JSON-Resume ⟷ FRESH)
* [ ] Support for FRESH resumes through conversion
* [ ] Resume editor (Electron App + live preview + [Json editor](https://github.com/josdejong/jsoneditor))
* [ ] Resume analysis
* [ ] Normalizing validation error messages [(z-schema-errors)](https://github.com/dschenkelman/z-schema-errors)
* [ ] Improve error handling and server life-cycle when serving the resume 
* [ ] ...

## Getting Started

Install globally from the NPM

```bash
npm install -g kiss-my-resume
```

You can also install locally and use the `npm link` command to create the _kissmyresume_ command

```bash
npm install kiss-my-resume

npm link
```

## Usage

```bash 
kissmyresume 0.8.0

   USAGE

     kissmyresume <command> [options]

   COMMANDS

     build <source>         Build your resume to the destination format(s).
     new <name>             Create a new resume in JSON Resume format.
     validate <source>      Validate structure and syntax of your resume.
     serve <source>         Show your resume in a browser with hot-reloading upon resume changes
     help <command>         Display help for a specific command

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
```
### Build
```bash
   USAGE

     cli.js build <source>

   ARGUMENTS

     <source>      The path to the source JSON resume file.      required

   OPTIONS

     -f, --format <format>              Set output format (HTML|PDF|YAML|DOCX|PNG|ALL)                                        optional      default: "all"                  
     -p, --paper-size <paper-size>      Set output size for PDF files (A4|Letter|Legal|Tabloid|Ledger|A0|A1|A2|A3|A5|A6)      optional      default: "A4"                   
     -o, --out <directory>              Set output directory                                                                  optional      default: "./out"                
     -n, --name <name>                  Set output file name                                                                  optional      default: "resume"               
     -t, --theme <theme>                Set the theme you wish to use                                                         optional      default: "jsonresume-theme-flat"
```
The default theme for the resume is the [flat-theme](https://github.com/erming/jsonresume-theme-flat) - same as resume-cli. You can use local themes or themes installed from NPM with the `-t, --theme` option flag. You can use the theme name `flat`, npm package name `jsonresume-theme-flat` or a local path `node_modules/jsonresume-theme-flat`.

The theme must expose a __render__ method returning the the HTML markup in its entry-point file. The theme can expose a __renderAsync__ method returning a Promise resolving to HTML Markup. With this, the theme will be still compatible with the HackMyResume and resume-cli tools.

Export to Docx is very basic and supports images as long they are encoded in Base64 and included within the HTML markup `<img src="data:image/gif;base64,R0lGOD ...` 

My [mocha-responsive](https://github.com/karlitos/jsonresume-theme-mocha-responsive) theme supports __async rendering__ and inline __Base64 encoded__ profile pictures, give it a shot!

### New

```bash
USAGE

     kissmyresume new <name>

   ARGUMENTS

     <name>      The name for the new resume file.      required

   OPTIONS

     -o, --out <directory>      Set output directory      optional      default: "./resume"
```
Creates new empty Json-resume with a given name.

### Validate
```bash
   USAGE

     cli.js validate <source>

   ARGUMENTS

     <source>      The path to the source JSON resume file to be validate.      required
```

Does some basic validation, printing either a success message or list of errors found by the validator.
```bash
--- Your resume contains errors ---

#    Additional properties not allowed: level in #/languages/1

#    Additional properties not allowed: years in #/languages/1
```

### Serve
```bash
USAGE

     kissmyresume serve <source>

   ARGUMENTS

     <source>      The path to the source JSON resume file to be served.      required

   OPTIONS

     -t, --theme <theme>      Set the theme you wish to use                        optional      default: "jsonresume-theme-flat"
     -p, --port <theme>       Set the port the webserver will be listening on      optional      default: 3000
```

Renders the resume to HTML with the selected theme, starts web server at the selected port, opens the rendered HTML in the default browser and watches the resume source for changes. Are changes detected, the resume will re-rendered and the page will be automatically reloaded. 

## License
MIT. Go crazy. See LICENSE.md for details.
