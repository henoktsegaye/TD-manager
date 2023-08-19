import {
  Disposable,
  Webview,
  window,
  Uri,
  WebviewViewProvider,
  CancellationToken,
  WebviewView,
  WebviewViewResolveContext,
  workspace,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { TDAnalytics } from "../TDAnalytics";
import { MessageFromWebPanel } from "./messageType";

export class AnalyticsWebPanel implements WebviewViewProvider {
  private _view: WebviewView | null = null;
  private _disposables: Disposable[] = [];

  constructor(private extensionUri: Uri, private _TDAnalytics: TDAnalytics) {
    this.watchForChanges();
  }

  watchForChanges() {
    const watcher = workspace.createFileSystemWatcher(
      "**/*.{*}",
      true,
      false,
      false
    );
    watcher.onDidChange(async () => {
      await this._TDAnalytics.setTds();
      await this.sendAnalytics();
    });
  }

  async resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext<unknown>,
    token: CancellationToken
  ): Promise<void> {
    if (token.isCancellationRequested) {
      this._TDAnalytics.clearState();
      return;
    }

    await this._TDAnalytics.setTds();
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = this._getWebviewContent(
      webviewView.webview,
      this.extensionUri
    );
    this._view = webviewView;
    this._setWebviewMessageListener(this._view);
    await this.sendAnalytics();
  }

  public async sendAnalytics() {
    this._sendWebviewMessage({
      command: "TDsByLevel",
      payload: await this._TDAnalytics.categorizeTDByLevel(),
    });
    const fileStat = await this._TDAnalytics.getHowMuchFilesHasTds();
    this._sendWebviewMessage({
      command: "TDsOverview",
      payload: fileStat,
    });
  }

  public dispose() {
    this._disposables.forEach((disposable) => disposable.dispose());
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>TD Analytics</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _sendWebviewMessage(message: MessageFromWebPanel) {
    this._view?.webview.postMessage(message);
  }

  private _setWebviewMessageListener(view: WebviewView) {
    view.webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;
      },
      undefined,
      this._disposables
    );
  }
}
