'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as mu from 'mu2';
import axios from 'axios';

// 設定の取得
const config = vscode.workspace.getConfiguration('redmine2doc');
const BASE_URL = config.redmineApiBaseUrl;
const API_KEY = config.redmineApiKey;
const FILE_TYPE = config.resultFileType;
const PROJECT_LIST_API_LIMIT = config.projectListApiLimit;
const ISSUE_LIST_API_LIMIT = config.issueListApiLimit;
const ISSUE_ORDER_DIRECTION = config.issueOrderDirectionDesc ? "desc" : "asc";
const ISSUE_TEMPLATE = 'issue.mustache';

// API リクエスト用インスタンス初期化
const request = axios.create({
    baseURL: BASE_URL,
});
request.defaults.headers.common['Content-Type'] = 'application/json';
request.defaults.headers.common['X-Redmine-API-Key'] = API_KEY;

export function activate(context: vscode.ExtensionContext) {
    // Issue => Document
    let disposable = vscode.commands.registerCommand('extension.convertIssue2Document', async () => {
        _checkConfigError();
        const templateDir = _resolveTemplateDir(config);
        // Redmine から取得する project の配列
        let projects: any[];
        // QuickPick に表示するプロジェクトの一覧を取得する
        const getProjectPickItems = async () => {
            projects = await _getProjectList();
            const items: vscode.QuickPickItem[] = projects.map(x => { return { label: x.name, description: x.description } });
            return items;
        };
        // QuickPick を表示してプロジェクトを選択
        const selectedProjectItem = await vscode.window.showQuickPick(getProjectPickItems(),
        {
            matchOnDescription: true,
            placeHolder: 'Select the target project...',
        })
        // 選択されなければ抜ける
        if (!selectedProjectItem) return;
        // 選択されたプロジェクト名のオブジェクトを検索
        const selectedProject = projects.find(x => x.name == selectedProjectItem.label && x.description == selectedProjectItem.description);
        // QuickPick に表示する Issue の一覧を取得する
        const getIssuePickItems = async () => {
            const issues = await _getIssueList(selectedProject.id);
            const items: vscode.QuickPickItem[] = issues.map(x => { return { label: x.id.toString(), description: x.subject } });
            return items;
        };
        // QuickPick を表示して Issue を選択
        const selectedIssueItem = await vscode.window.showQuickPick(getIssuePickItems(),
        {
            matchOnDescription: true,
            placeHolder: 'Select the target issue...',
        })
        // 選択されなければ抜ける
        if (!selectedIssueItem) return;
        // Issue の詳細を取得
        const issue = await _getIssueDetail(+selectedIssueItem.label);
        // テンプレートから生成
        const content = await _openCreateIssueDocument(path.resolve(templateDir, ISSUE_TEMPLATE), issue);
        const doc = await vscode.workspace.openTextDocument({
            language: FILE_TYPE,
            content: content,
        });
        await vscode.window.showTextDocument(doc);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

function _resolveTemplateDir(config) {
    let dir = config.templateDir;
    if (!path.isAbsolute(config.templateDir)) {
        dir = path.resolve(vscode.workspace.rootPath, dir);
    }
    if (!fs.existsSync(dir)) {
        throw `"${dir}" is not found. Check your config "redmine2doc.templateDir"`;
    }
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
        throw `"${dir}" is not a directory. Check your config "redmine2doc.templateDir"`;
    }
    return dir;
}

function _checkConfigError() {
    if (!BASE_URL) {
        throw 'Config "redmine2doc.redmineApiBaseUrl" must be set.';
    } else if (!API_KEY) {
        throw 'Config "redmine2doc.redmineApiKey" must be set.';
    }
}

async function _getProjectList(): Promise<any[]> {
    const res = await request
        .get(`/projects.json`, {
            params: {
                'limit': PROJECT_LIST_API_LIMIT,
            },
        });
    return res.data.projects;
}

async function _getIssueList(projectId: Number): Promise<any[]> {
    const res = await request
        .get(`/issues.json`, {
            params: {
                'project_id': projectId,
                'limit': ISSUE_LIST_API_LIMIT,
                'sort': 'id:' + ISSUE_ORDER_DIRECTION,
                'status_id': '*',
            },
        });
    return res.data.issues;
}

async function _getIssueDetail(issueId: Number): Promise<any> {
    const res = await request
        .get(`/issues/${issueId}.json`, {
            params: {
                'include': 'journals',
            },
        });
    const issue = res.data.issue;
    return issue;
}

function _openCreateIssueDocument(templatePath: string, issue: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let content = '';
        mu.compileAndRender(templatePath, issue)
            .on('data', data => {
                content += data.toString();
            })
            .on('end', () => {
                resolve(content);
            })
            .on('error', error => {
                reject(error);
            })
    });
}
