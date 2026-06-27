import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GithubAutomationResult = {
  skipped: boolean;
  action: string;
  message: string;
  details?: unknown;
};

type ApplyRepoTeamAccessInput = {
  fullName: string;
};

@Injectable()
export class GithubOrgService {
  private readonly githubApiBase = 'https://api.github.com';

  constructor(private readonly config: ConfigService) {}

  async addContributorToTeam(githubUsername: string): Promise<GithubAutomationResult> {
    if (!this.isEnabled()) {
      return this.skipped('add contributor to team', 'GitHub org automation is disabled.');
    }

    const token = this.token();
    const org = this.orgName();
    const teamSlug = this.contributorTeamSlug();

    if (!token || !org || !teamSlug) {
      return this.skipped('add contributor to team', 'GitHub org token, org name, or contributor team slug is not configured.');
    }

    const username = githubUsername.trim().replace(/^@/, '');

    if (!username) {
      throw new BadRequestException('GitHub username is required.');
    }

    const response = await this.githubRequest(
      `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ role: 'member' }),
      },
    );

    return {
      skipped: false,
      action: 'add contributor to team',
      message: `GitHub user ${username} was added or invited to ${teamSlug}.`,
      details: response,
    };
  }

  async applyCourseRepoTeamAccess(input: ApplyRepoTeamAccessInput) {
    if (!this.isEnabled()) {
      return this.skipped('apply repository team access', 'GitHub org automation is disabled.');
    }

    const token = this.token();
    const org = this.orgName();

    if (!token || !org) {
      return this.skipped('apply repository team access', 'GitHub org token or org name is not configured.');
    }

    const { owner, repo } = this.parseRepository(input.fullName);
    const teamPermissions = [
      { slug: this.contributorTeamSlug(), permission: 'push' },
      { slug: this.reviewerTeamSlug(), permission: 'maintain' },
      { slug: this.adminTeamSlug(), permission: 'admin' },
    ].filter((item) => item.slug);

    if (!teamPermissions.length) {
      return this.skipped('apply repository team access', 'No GitHub team slugs are configured.');
    }

    const results = [];

    for (const item of teamPermissions) {
      const result = await this.githubRequest(
        `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(item.slug)}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ permission: item.permission }),
        },
      );

      results.push({ teamSlug: item.slug, permission: item.permission, result });
    }

    return {
      skipped: false,
      action: 'apply repository team access',
      message: `Applied ${results.length} team permission rule(s) to ${owner}/${repo}.`,
      repository: `${owner}/${repo}`,
      results,
    };
  }

  private async githubRequest(path: string, init: RequestInit) {
    const response = await fetch(`${this.githubApiBase}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'tribe-block-github-org-automation',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = text ? this.safeJson(text) : null;

    if (!response.ok) {
      throw new BadRequestException(`GitHub org automation failed: ${response.status} ${response.statusText} ${text}`);
    }

    return payload;
  }

  private parseRepository(fullName: string) {
    const cleaned = fullName.trim().replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
    const [owner, repo] = cleaned.split('/');

    if (!owner || !repo) {
      throw new BadRequestException('Repository must be provided as owner/repo, for example Tribe-Block-University/learn-html.');
    }

    return { owner, repo };
  }

  private safeJson(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private skipped(action: string, message: string): GithubAutomationResult {
    return { skipped: true, action, message };
  }

  private isEnabled() {
    return this.config.get<boolean>('GITHUB_ORG_AUTOMATION_ENABLED') ?? true;
  }

  private token() {
    return this.config.get<string>('GITHUB_ORG_ADMIN_TOKEN');
  }

  private orgName() {
    return this.config.get<string>('GITHUB_ORG_NAME') ?? 'Tribe-Block-University';
  }

  private contributorTeamSlug() {
    return this.config.get<string>('GITHUB_CONTRIBUTOR_TEAM_SLUG') ?? 'course-contributors';
  }

  private reviewerTeamSlug() {
    return this.config.get<string>('GITHUB_REVIEWER_TEAM_SLUG') ?? 'course-reviewers';
  }

  private adminTeamSlug() {
    return this.config.get<string>('GITHUB_ADMIN_TEAM_SLUG') ?? 'admins';
  }
}
