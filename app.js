/*
 * @author Matthew James <Quacky2200@hotmail.com>
 * App behaviour class
 */
const FS = require('fs');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;
//Let's load up our application
if(typeof(electron) != 'object' && !electron.app){
	console.log('The Electron installation cannot be found. Aborting...');
	process.exit(-1);
}
App = (function(){
	let _spotify;
	class App {
		constructor(){
			this.settings = require('./app-settings')(
				`${App.paths.home}/preferences.json`,
				require('./defaults.json')
			);
			require('./plugins')(app);
			//Set Cache
			app.setPath('userData', App.paths.home);
			app.setPath('userCache', `${App.paths.home}/Cache`);
			//Some fonts and images are not always served over HTTPS -_-
			app.commandLine.appendSwitch('--allow-running-insecure-content');
			app.commandLine.appendSwitch('--ignore-certificate-errors');
			//Set the name of the application
			app.setName(App.names.process);
			//Set the process name
			process.title = App.names.process;
			//When Electron has loaded, start opening the window.
			app.on('ready', () => {
				this.settings.open((err, data) => {
					if(err){
						console.log("The settings are corrupt, cannot continue.");
						process.exit(-1);
					}
					var Spotify = require('./windows/spotify/window');
					_spotify = new Spotify();
				});
			});
			this.setApplicationMenu = app.setApplicationMenu;
			this.quit = app.quit;
			this.openLink = electron.shell.openExternal;
			this.setLoginItemSettings = app.setLoginItemSettings;
			app.on('quit', () => {
				console.log('Exiting...');
			});
			//Make sure we only run one instance of the application
			var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
				// Someone tried to run a second instance, we should focus our window.
				if (_spotify) {
					if (_spotify.isMinimized()) _spotify.restore();
					_spotify.show();
					_spotify.focus();
				}
			});
			//Quit if we're trying to run another instance
			if (shouldQuit) {
				console.log('An instance is already running, exiting...');
				app.quit();
				return;
			}
			//Let's support OS X anyways.
			app.on('activate', function () {
				_spotify.show();
				_spotify.unmaximize();
			});
		}
		get version(){
			return electron.app.getVersion();
		}
		static get names(){
			return {
				process: 'spotifywebplayer',
				service: 'Spotify Web Player',
				project: 'Spotify Web Player for Linux'
			}
		}
		get names(){
			return App.names;
		}
		static get host(){
			return 'https://play.spotify.com';
		}
		get host(){
			return App.host;
		}
		static get paths(){
			var USER_PATH = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
			var HOME_PATH = `${USER_PATH}/.spotifywebplayer`;
			return {
				user: USER_PATH,
				home: HOME_PATH,
				caches: {
					lyrics: `${HOME_PATH}/LyricCache`,
					albums: `${HOME_PATH}/AlbumCache`
				},
				icons: `${__dirname}/icons`,
				themes: `${__dirname}/windows/spotify/themes`
			}
		}
		get paths(){
			return App.paths;
		}
		sanitizeFilename(filename){
			return sanitize(filename);
		}
		getFilesInDir(filepath){
			return FS.readdirSync(filepath);
		}
		checkPathExists(path, cb){
			FS.access(path, FS.constants.R_OK || FS.constants.W_OK || FS.constants.F_OK, (err) => cb(err));
		}
		getUTF8File(filename, cb){
			FS.readFile(filename, {encoding: 'utf-8'}, (err, data) => cb(err, data));
		}
		createUTF8File(filename, text, cb){
			FS.writeFile(filename, text, {encoding: 'utf-8'}, (err) => cb(err));
		}
		createFile(filename, data, type, cb){
			FS.writeFile(filename, data, type, (err) => cb(err));
		}
		readFile(filename, type, cb){
			FS.readFile(filename, type, (err, data) => cb(err, data));
		}
		getImageFileAsBase64(filename, cb){
			FS.readFile(filename, {encoding: 'base64'}, (err, data) => cb(err, data));
		}
		createDirectory(filepath, cb){
			FS.mkdir(filepath, (err) => cb(err));
		}
		static get icon(){
			return `${App.paths.icons}/spotify.png`;
		}
		get icon(){
			return App.icon;
		}
		get spotify(){
			return _spotify;
		}
	}
	return App;
})();
const APP = new App();
global.app = APP;
process.on('SIGINT', () => {
  console.log('Received SIGINT (Ctrl-C). Exiting...');
  app.quit();
  process.exit(0);
});
