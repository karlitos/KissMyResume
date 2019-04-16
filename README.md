# KissMyResume

_[HackMyResume](https://github.com/hacksalot/HackMyResume) but [Keep it simple, (stupid)](https://en.wikipedia.org/wiki/KISS_principle)_. I really liked the original HackMyResume tool, but it lacked some important features, did not always provide the best results and I found the code base rather complicated. So I created my own version, strongly inspired by the HackMyResume project and the [resume-cli](https://github.com/jsonresume/resume-cli), but tried to __keep it simple__ by relying on off-the-shelf tools and libraries.

The project is still WIP and in very early stage. It targets following shortcomings of the __HackMyResume__ [1] and __resume-cli__ [2] tools:
* missing support for asynchronous template rendering (1,2)
* PDF export relying on 3rd party tools (1)
* exported PDF looking differently than HTML printed as PDF (1)
* no support for local themes (2) 

## Current status

### Currently supported
 
* [x] CLI - implemented with the [Caporal.js](https://github.com/mattallty/Caporal.js) framework.
* [x] Support for resumes in [JSON-resume](https://jsonresume.org/) format
* [x] Support for [Json-resume themes](https://jsonresume.org/themes/) 
* [x] Export in all formats without the necessity for any 3rd party libraries/tools
* [x] Export to HTML
* [x] Export to PDF and PNG utilizing the [puppeteer](https://github.com/GoogleChrome/puppeteer) Headless Chrome Node API 
* [x] Export to DOCX with the [html-docx-js](https://github.com/evidenceprime/html-docx-js) library
* [x] Export to YAML with the [json2yaml](https://git.coolaj86.com/coolaj86/json2yaml.js) utility
* [x] Export to all formats at once

### To do

* [ ] Resume validation (JSON-Resume, FRESH)
* [ ] Resume conversion  (JSON-Resume ⟷ FRESH)
* [ ] Support for FRESH resumes through conversion
* [ ] Empty resume initialization (_init_)
* [ ] Resume HTML live preview (_serve_)
* [ ] Resume analysis
* [ ] Resume editor (live preview + [Json editor](https://github.com/josdejong/jsoneditor))
* [ ] ...

## Getting Started

~~Install from the NPM~~ once published

## Usage

```bash
cli.js 0.5.0

   USAGE

     cli.js build <source>

   ARGUMENTS

     <source>      The path to the source JSON resume file.      required

   OPTIONS

     -f, --format <format>      Set output format (HTML|PDF|YAML|DOCX|PNG|ALL)      optional      default: "all"
     -o, --out <directory>      Set output directory                                optional      default: "./out"
     -n, --name <name>          Set output file name                                optional      default: "resume"
     -t, --theme <theme>        Set the theme you wish to use                       optional      default: "jsonresume-theme-flat"

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
```
### Build
The default theme for the resume is the [flat-theme](https://github.com/erming/jsonresume-theme-flat) - same as resume-cli. You can use local themes or themes installed from NPM with the `-t, --theme` option flag. You can use the theme name `flat`, npm package name `jsonresume-theme-flat` or a local path `node_modules/jsonresume-theme-flat`.

The theme must expose a __render__ method returning the the HTML markup in its entry-point file. The theme can expose a __renderAsync__ method returning a Promise resolving to HTML Markup. With this, the theme will be still compatible with the HackMyResume and resume-cli tools.

Export to Docx is very basic and supports images as long they are encoded in Base64 and included within the HTML markup `<img src="data:image/gif;base64,R0lGOD ...` 

My [mocha-responsive](https://github.com/karlitos/jsonresume-theme-mocha-responsive) theme supports __async rendering__ and inline __Base64 encoded__ profile pictures, give it a shot!
 
## License
MIT. Go crazy. See LICENSE.md for details.
