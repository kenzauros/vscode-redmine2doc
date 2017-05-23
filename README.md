# Redmine2Doc README

Extension for Visual Studio Code to fetch data from Redmine via the REST API and convert it to a templated document.

## Features

* Get an issue from your Redmine and convert it to a new document using a template file.
* Mustache is available for template.

## Requirements

### Enable REST API

Your Redmine must allow REST API requests. It can be turned on through the Redmine settings page (`/settings`).

### Set Redmine API Base URL

Set the root URL of your Redmine to `redmine2doc.redmineApiBaseUrl` in config.

For example: `"redmine2doc.redmineApiBaseUrl": "https://redmine.sample.com/"`

### Set API Key

This extension also needs **API access key** for Redmine. You can get the key at your own "my page" (`/my/account`). Set the key to `redmine2doc.redmineApiKey` in config.

For example: `"redmine2doc.redmineApiKey": "j9352f9a8n2n3raojdlfaldfaf382831vzcz8et5"`

### Place Template file and set the path

Redmine data is going to be converted with a Mustache template.

Place a template such as the following and specify the file path through `redmine2doc.templatePath` in config.

Each attribute of issue can be used as a variable in the template as follows.

```
{{subject}} (#{{id}})
=====

* Date: {{created_on}}
* Status: {{status.name}}
* Priority: {{priority.name}}
* Category: {{category.name}}
* Tracker: {{tracker.name}}
* Author:  {{author.name}}

{{{description}}}

{{#journals}}{{#notes}}
- - -
### {{user.name}} ({{created_on}})

{{{notes}}}
{{/notes}}{{/journals}}
```


* [Mustache Official Manual](http://mustache.github.io/mustache.5.html)
* [Redmine REST API - Issue](http://www.redmine.org/projects/redmine/wiki/Rest_Issues)

## Extension Settings

At least you have to set `redmine2doc.redmineApiBaseUrl` and `redmine2doc.redmineApiKey`.

This extension contributes the following settings:

* `redmine2doc.redmineApiBaseUrl`: URL to Redmine REST API
* `redmine2doc.redmineApiKey`: Redmine API Key to get data
* `redmine2doc.templateDir`: Directory path to Mustache templates
* `redmine2doc.resultFileType`: File type of the result document
* `redmine2doc.projectListApiLimit`: Limit param for project list API
* `redmine2doc.issueListApiLimit`: Limit param for issue list API
* `redmine2doc.issueOrderDirectionDesc`: Show issues in descending order
* `redmine2doc.timezone`: Timezone
* `redmine2doc.datetimeFormat`: Format string for date and time

## Known Issues


## Release Notes

### 0.0.1

Initial private release.

### 0.0.2

Add timezone conversion for issue and journal's timestamp.