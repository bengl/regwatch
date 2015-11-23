# regwatch(1) -- a tool for watching npm registry updates

## DESCRIPTION

This program will watch the changes feed from the npm registry, formatting it
in whatever format you like and printing that to stdout.

## INSTALLATION

    $ npm i -g regwatch

## USAGE

    $ regwatch [options]

Options:
  
  * `-0, --from-zero`: Get changes starting at sequence 0. This overrides
  `--back`.
  * `-h, --help`: Show help.
  * `--new`: Only output for brand-new modules.
  * `--back=<num>`: How far back in the feed to start (default 10).
  * `--format=<format>` How to display each change (default: "name"). See FORMAT
  below.
  * `--growl`: Receive a growl notification for each change. See GROWL below.
  * `-c, --cmd`: A shell command to run for each change, See SHELL COMMAND below.
  * `-e, --eval`: JavaScript to evaluate for each change. See EVAL below.
  * `-E, --eval-implicit-return`: Like `eval`, but with an implicit `return `
  before your code. See EVAL below.

## GROWL

To enable growl notifications with the `--growl` options, make sure an
appropriate [Growl helper] is installed for your platform.

## FORMAT

By default, the output format is `name`, which will only output the name of the
module.

The only other option for format, currently, is `npmurl`, which will output the
url to the package on the npm website. To activate this format:

    $ regwatch --format npmurl

## EVAL

When invoked with `--eval <script>` or `-e <script>`, regwatch will execute the
Javascript code in `<script>` on each change object. Change objects have the
form:

    {
        id: 'name-of-module',
        rev: {
            num: 12 // an integer showing # of times module has been published
            hash: 'abc123...' // a hash of the change
        }
    }

Your code must explicitly `return` a value, which will be outputted. The `this`
variable refers to the change object.

For example:

    $ regwatch -e 'return this.id + (this.rev.num == 1 ? " NEW" : "")'

Would output something like:

    old-module
    new-module NEW
    some-other-module
    some-other-new-module NEW

If your code is a one-liner, you can also have an implicit `return` in front
of your code. To do this, use `-E` or `--eval-implicit-return`. For example, the
following would produce the same output as above:

    $ regwatch -E 'this.id + (this.rev.num == 1 ? " NEW" : "")'

## SHELL COMMAND

You can execute a shell command for each change that is processed. An
environment variable `$CHANGE_ID` is provided, which is the name of the module.
The `$CHANGE_REV` variable has the full rev number from the change.

Example:

    $ regwatch --cmd 'echo hello \$CHANGE_ID \$CHANGE_REV'

Would output something like:

    hello some-module 12-abc123...
    hello fun-module 4-beef741...
    ...

## LICENSE

MIT License. See LICENSE.txt

[Growl helper]: https://www.npmjs.com/package/growl#install
