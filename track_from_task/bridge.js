const StorageKeys = {
	settings: "tft_hosts",
};

window.addEventListener("message", async (event) => {
	if (event.source !== window) return;

	if (event.data.type === "GET_HOSTS") {
        const settings = await chrome.storage.sync.get(StorageKeys.settings);
        const hosts = settings[StorageKeys.settings];

		window.postMessage({
			type: "HOSTS_RESPONSE",
			hosts,
		});
	}
});
