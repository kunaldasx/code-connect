import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GITHUB_API_URL } from "@/lib/constants";
import {
  validateGitHubBranch,
  validateGitHubPath,
  validateGitHubRepo,
} from "@/lib/github";

interface CommitRequest {
  branch: string;
  commitMessage: string;
  content: string;
  filename: string;
  path: string;
  repo: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body: CommitRequest = await request.json();
    const { repo, branch, path, filename, commitMessage, content } = body;

    console.log("========== COMMIT REQUEST ==========");
    console.log("repo:", repo);
    console.log("branch:", branch);
    console.log("path:", path);
    console.log("filename:", filename);
    console.log("commitMessage:", commitMessage);
    console.log("content length:", content?.length);

    if (
      !(
        repo &&
        branch &&
        filename &&
        validateGitHubRepo(repo) &&
        validateGitHubBranch(branch) &&
        validateGitHubPath(filename)
      ) ||
      (path && !validateGitHubPath(path))
    ) {
      return NextResponse.json(
        { error: "Invalid parameter value" },
        { status: 400 },
      );
    }

    const filePath = path ? `${path}/${filename}` : filename;

    const encodedRepo = repo.split("/").map(encodeURIComponent).join("/");

    const encodedFilePath = filePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const encodedBranch = encodeURIComponent(branch);

    console.log("GITHUB_API_URL:", GITHUB_API_URL);
    console.log("filePath:", filePath);
    console.log("encodedRepo:", encodedRepo);
    console.log("encodedFilePath:", encodedFilePath);
    console.log("encodedBranch:", encodedBranch);

    console.log("\n========== USER CHECK ==========");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log("USER STATUS:", userResponse.status);
    console.log("OAUTH SCOPES:", userResponse.headers.get("x-oauth-scopes"));

    console.log("USER:");
    console.log(await userResponse.text());

    console.log("\n========== REPO CHECK ==========");

    const repoResponse = await fetch(
      `https://api.github.com/repos/${encodedRepo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    console.log("REPO STATUS:", repoResponse.status);

    const repoData = await repoResponse.json();

    console.log("REPO DATA:");
    console.dir(repoData, { depth: null });

    console.log("REPO PERMISSIONS:");
    console.dir(repoData.permissions, { depth: null });

    const getFileUrl = `${GITHUB_API_URL}/repos/${encodedRepo}/contents/${encodedFilePath}?ref=${encodedBranch}`;

    console.log("\n========== GET FILE CHECK ==========");
    console.log("GET URL:", getFileUrl);

    let currentSha: string | null = null;

    const getFileResponse = await fetch(getFileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log("GET STATUS:", getFileResponse.status);

    const getFileText = await getFileResponse.text();

    console.log("GET RESPONSE:");
    console.log(getFileText);

    try {
      const parsed = JSON.parse(getFileText);

      if (parsed.sha) {
        currentSha = parsed.sha;
        console.log("FOUND SHA:", currentSha);
      } else {
        console.log("NO SHA FOUND");
      }
    } catch {
      console.log("GET RESPONSE WAS NOT JSON");
    }

    console.log("\n========== COMMIT BODY ==========");

    const commitBody = {
      message: commitMessage,
      content,
      branch,
      ...(currentSha && { sha: currentSha }),
    };

    console.dir(commitBody, { depth: null });

    const putUrl = `${GITHUB_API_URL}/repos/${encodedRepo}/contents/${encodedFilePath}`;

    console.log("\n========== PUT REQUEST ==========");
    console.log("PUT URL:", putUrl);

    const response = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(commitBody),
    });

    console.log("PUT STATUS:", response.status);

    console.log(
      "PUT RATE LIMIT:",
      response.headers.get("x-ratelimit-remaining"),
    );

    const responseText = await response.text();

    console.log("PUT RESPONSE:");
    console.log(responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to commit file",
          githubStatus: response.status,
          githubResponse: responseText,
          debug: {
            repo,
            branch,
            filePath,
            putUrl,
            hasSha: !!currentSha,
            contentLength: content?.length,
          },
        },
        { status: response.status },
      );
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }

    console.log("\n========== SUCCESS ==========");
    console.dir(result, { depth: null });

    return NextResponse.json(result);
  } catch (error) {
    console.error("========== FATAL ERROR ==========");
    console.error(error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
