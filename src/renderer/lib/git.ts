import simpleGit from 'simple-git';

export async function initGitRepo(workspacePath: string) {
  const git = simpleGit(workspacePath);
  if (!(await git.checkIsRepo())) {
    await git.init();
  }
  return git;
}

export async function getGitStatus(workspacePath: string) {
  const git = simpleGit(workspacePath);
  return git.status();
}

export async function commitChanges(workspacePath: string, message: string) {
  const git = simpleGit(workspacePath);
  await git.add('.');
  return git.commit(message);
}

export async function pushChanges(workspacePath: string, remote?: string, branch?: string) {
  const git = simpleGit(workspacePath);
  return git.push(remote || 'origin', branch || 'main');
}
