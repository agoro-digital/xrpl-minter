# Welcome to the CRPL-Minter contirbuting guide

Thank you for investing your time in contributing to our project! :sparkles:.

## New contributor guide

To get an overview of the project, take a look at the [README](README.md).

## Getting started

### Issues

#### Create a new issue

If you spot a problem in the codebase, or find a bug when using one of the packages, [search if an issue already exists](https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-issues-and-pull-requests#search-by-the-title-body-or-comments). If a related issue doesn't exist, you can open a new issue using a relevant [issue form](https://github.com/agoro-digital/xrpl-minter/issues/new/choose).

#### Solve an issue

Scan through our [existing issues](https://github.com/agoro-digital/xrpl-minter/issues) to find one that interests you.

### Make changes

#### Make changes locally

1. Fork the repository

- Using GitHub Desktop:

  - [Getting started with GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/getting-started-with-github-desktop) will guide you through setting up Desktop.
  - Once Desktop is set up, you can use it to [fork the repo](https://docs.github.com/en/desktop/contributing-and-collaborating-using-github-desktop/cloning-and-forking-repositories-from-github-desktop)!

- Using the command line:

  - [Fork the repo](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository) so that you can make your changes without affecting the original project until you're ready to merge them.

- GitHub Codespaces:
  - [Fork, edit, and preview](https://docs.github.com/en/free-pro-team@latest/github/developing-online-with-codespaces/creating-a-codespace) using [GitHub Codespaces](https://github.com/features/codespaces) without having to install and run the project locally.

2. Ensure you have `yarn` installed on your machine.
3. Create a working branch and start with your changes!

### Commit your update

Commit the changes once you're happy with them. The repo uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) as a standard. To help ensure this standard is followed, we use [commitizen](https://github.com/commitizen/cz-cli). This CLI tool will be triggered whenever you run `git commit`, or `yarn cm`

### Pull Request

When you're finished with the changes, create a pull request, also known as a PR.

- Don't forget to [link PR to issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) if you are solving one.
- We may ask for changes to be made before a PR can be merged, either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request) or pull request comments. You can apply suggested changes directly through the UI. You can make any other changes in your fork, then commit them to your branch.

### Your PR is merged!

Congratulations! We thank you for you contribution, and helping the make the XRPL Minter tools even better :tada:
