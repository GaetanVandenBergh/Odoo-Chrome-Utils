const StorageSync = chrome.storage.sync;
const StorageKeys = {
	settings: "tft_hosts",
};

const HostConfigKeys = {
    stage: "stage",
	projects: "projects",
	taskTags: "taskTags",
    durationTags: "durationTags",
    titleTags: "titleTags",
    descriptionSkip: "descriptionSkip",
    trackCreatedTag: "trackCreatedTag"
};

const ElementIds = {
	addHostBtn: "addHostBtn",
	deleteHostBtn: "deleteHostBtn",
	addProjectBtn: "addProjectBtn",
	addTaskTagBtn: "addTaskTagBtn",
	addDurationTagBtn: "addDurationTagBtn",
	addTitleTagBtn: "addTitleTagBtn",
	addDescriptionSkipBtn: "addDescriptionSkipBtn",
	newHostInput: "newHost",
	hostList: "hostList",
	hostTitle: "hostTitle",
	editor: "editor",
	stageInput: "stageInput",
	trackCreatedTagInput: "trackCreatedTagInput",
	projectTable: "projectTable",
	taskTagTable: "taskTagTable",
	durationTagTable: "durationTagTable",
	titleTagTable: "titleTagTable",
	descriptionSkipTable: "descriptionSkipTable",
    exportHostBtn: "exportHostBtn",
    importHostBtn: "importHostBtn",
    importNewHostBtn: "importNewHostBtn",
    importFile: "importFile",
};

const Selectors = {
	projectTable: "#projectTable",
	taskTagTable: "#taskTagTable",
	durationTagTable: "#durationTagTable",
	titleTagTable: "#titleTagTable",
	descriptionSkipTable: "#descriptionSkipTable",
	projectId: ".project-id",
	eventId: ".event-id",
	taskTagId: ".task-tag-id",
	eventTagId: ".event-tag-id",
	durationTaskTagId: ".duration-task-tag-id",
	durationValue: ".duration-value",
	titleRegex: ".title-regex",
	titleEventTagId: ".title-event-tag-id",
	descriptionSkipRegex: ".description-skip-regex",
	deleteButton: "button",
};

let hosts = {};
let selectedHost = null;

async function load() {
	hosts = await loadHosts();
	const host = Object.keys(hosts).splice(0)[0];
	selectHost(host);
}

async function save() {
	syncEditorToHost();
	await saveHosts();
}

//region HTML
document.getElementById(ElementIds.addHostBtn).onclick = async () => addHost();
document.getElementById(ElementIds.deleteHostBtn).onclick = async () => deleteHost();

document.getElementById(ElementIds.addProjectBtn).onclick = async () => addProjectRow();
document.getElementById(ElementIds.addTaskTagBtn).onclick = async () => addTaskTagRow();
document.getElementById(ElementIds.addDurationTagBtn).onclick = async () => addDurationTagRow();
document.getElementById(ElementIds.addTitleTagBtn).onclick = async () => addTitleTagRow();
document.getElementById(ElementIds.addDescriptionSkipBtn).onclick = async () => addDescriptionSkipRow();

const stageInput = document.getElementById(ElementIds.stageInput);
stageInput.addEventListener("blur", () => save());
stageInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		save();
	}
});

const trackCreatedTagInput = document.getElementById(ElementIds.trackCreatedTagInput);
trackCreatedTagInput.addEventListener("blur", () => save());
trackCreatedTagInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		save();
	}
});

document.getElementById(ElementIds.exportHostBtn).onclick = () => exportJSON();
document.getElementById(ElementIds.importHostBtn).onclick = () => importHost();
document.getElementById(ElementIds.importNewHostBtn).onclick = () => importNewHost();

function syncEditorToHost() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.stage] = undefined;
	configuration[HostConfigKeys.projects] = {};
	configuration[HostConfigKeys.taskTags] = {};
	configuration[HostConfigKeys.durationTags] = {};
	configuration[HostConfigKeys.titleTags] = {};
	configuration[HostConfigKeys.descriptionSkip] = [];

	const stageValue = document.getElementById(ElementIds.stageInput).value.trim();
	if (stageValue !== "") {
		configuration[HostConfigKeys.stage] = Number(stageValue);
	} else {
		delete configuration[HostConfigKeys.stage];
	}

	const trackCreatedTagValue = document.getElementById(ElementIds.trackCreatedTagInput).value.trim();
	if (trackCreatedTagValue !== "") {
		configuration[HostConfigKeys.trackCreatedTag] = Number(trackCreatedTagValue);
	} else {
		delete configuration[HostConfigKeys.trackCreatedTag];
	}

	for (const row of document.querySelectorAll(`${Selectors.projectTable} tr`)) {
		const projectId = row.querySelector(Selectors.projectId).value.trim();
		const eventId = row.querySelector(Selectors.eventId).value.trim();
		if (!projectId && !eventId) continue;
		if (projectId) configuration[HostConfigKeys.projects][projectId] = Number(eventId);
	}

	for (const row of document.querySelectorAll(`${Selectors.taskTagTable} tr`)) {
		const taskTagId = row.querySelector(Selectors.taskTagId).value.trim();
		const eventTagId = row.querySelector(Selectors.eventTagId).value.trim();
		if (!taskTagId && !eventTagId) continue;
		if (taskTagId) configuration[HostConfigKeys.taskTags][taskTagId] = Number(eventTagId);
	}

	for (const row of document.querySelectorAll(`${Selectors.durationTagTable} tr`)) {
		const taskTagId = row.querySelector(Selectors.durationTaskTagId).value.trim();
		const duration = row.querySelector(Selectors.durationValue).value;
		if (!taskTagId || duration === "") continue;
		configuration[HostConfigKeys.durationTags][taskTagId] = parseFloat(duration);
	}

	for (const row of document.querySelectorAll(`${Selectors.titleTagTable} tr`)) {
		const regex = row.querySelector(Selectors.titleRegex).value.trim();
		const eventTagId = row.querySelector(Selectors.titleEventTagId).value.trim();
		if (!regex && !eventTagId) continue;
		if (regex) configuration[HostConfigKeys.titleTags][regex] = Number(eventTagId);
	}

	for (const row of document.querySelectorAll(`${Selectors.descriptionSkipTable} tr`)) {
		const regex = row.querySelector(Selectors.descriptionSkipRegex).value.trim();
		if (!regex) continue;
		configuration[HostConfigKeys.descriptionSkip].push(regex);
	}
}

//endregion

//regionn Buttons
async function addHost() {
	const input = document.getElementById(ElementIds.newHostInput);
	const host = input.value.trim();
	if (!host) return;
	if (!isValidHostName(host)) {
		alert("Invalid host name. Please enter a valid hostname like www.odoo.com.");
		input.focus();
		return;
	}

	hosts[host] = hosts[host] || {
		[HostConfigKeys.stage]: undefined,
		[HostConfigKeys.projects]: {},
		[HostConfigKeys.taskTags]: {},
		[HostConfigKeys.durationTags]: {},
		[HostConfigKeys.titleTags]: {},
		[HostConfigKeys.descriptionSkip]: [],
		[HostConfigKeys.trackCreatedTag]: undefined,
	};
	await saveHosts();
	input.value = "";
	selectHost(host);
}

async function deleteHost() {
	if (!selectedHost) return;
	if (!confirm(`Delete ${selectedHost}?`)) return;
	delete hosts[selectedHost];
	saveHosts();

	const host = Object.keys(hosts).splice(0)[0];
	selectHost(host);
}

function selectHost(host) {
	selectedHost = host;
	renderHosts();
	renderEditor();
}

async function addProjectRow() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.projects] = configuration[HostConfigKeys.projects] || {};

	const row = renderProjectRow("", "");
	row.querySelector(Selectors.projectId).focus();
}

async function addTaskTagRow() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.taskTags] = configuration[HostConfigKeys.taskTags] || {};

	const row = renderTaskTagRow("", "");
	row.querySelector(Selectors.taskTagId).focus();
}

async function addDurationTagRow() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.durationTags] = configuration[HostConfigKeys.durationTags] || {};

	const row = renderDurationTagRow("", "0");
	row.querySelector(Selectors.durationTaskTagId).focus();
}

async function addTitleTagRow() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.titleTags] = configuration[HostConfigKeys.titleTags] || {};

	const row = renderTitleTagRow("", "");
	row.querySelector(Selectors.titleRegex).focus();
}

async function addDescriptionSkipRow() {
	if (!selectedHost) return;
	const configuration = hosts[selectedHost];
	configuration[HostConfigKeys.descriptionSkip] = configuration[HostConfigKeys.descriptionSkip] || [];

	const row = renderDescriptionSkipRow("");
	row.querySelector(Selectors.descriptionSkipRegex).focus();
}

//endregion

//region Bind
function bindProjectRow(row) {
	const projectInput = row.querySelector(Selectors.projectId);
	const eventInput = row.querySelector(Selectors.eventId);
	const deleteButton = row.querySelector(Selectors.deleteButton);

	const sync = () => save();
	projectInput.addEventListener("blur", sync);
	eventInput.addEventListener("blur", sync);
	projectInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			eventInput.focus();
		}
	});
	eventInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			save();
		}
	});

	deleteButton.onclick = () => {
		row.remove();
		save();
	};
}

function bindTaskTagRow(row) {
	const taskTagInput = row.querySelector(Selectors.taskTagId);
	const eventTagInput = row.querySelector(Selectors.eventTagId);
	const deleteButton = row.querySelector(Selectors.deleteButton);

	const sync = () => save();
	taskTagInput.addEventListener("blur", sync);
	eventTagInput.addEventListener("blur", sync);
	taskTagInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			eventTagInput.focus();
		}
	});
	eventTagInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			save();
		}
	});

	deleteButton.onclick = () => {
		row.remove();
		save();
	};
}

function bindDurationTagRow(row) {
	const taskTagInput = row.querySelector(Selectors.durationTaskTagId);
	const durationSelect = row.querySelector(Selectors.durationValue);
	const deleteButton = row.querySelector(Selectors.deleteButton);

	const sync = () => save();
	taskTagInput.addEventListener("blur", sync);
	durationSelect.addEventListener("change", sync);
	taskTagInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			durationSelect.focus();
		}
	});
	durationSelect.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			save();
		}
	});

	deleteButton.onclick = () => {
		row.remove();
		save();
	};
}

function bindTitleTagRow(row) {
	const regexInput = row.querySelector(Selectors.titleRegex);
	const eventTagInput = row.querySelector(Selectors.titleEventTagId);
	const deleteButton = row.querySelector(Selectors.deleteButton);

	const sync = () => save();
	regexInput.addEventListener("blur", sync);
	eventTagInput.addEventListener("blur", sync);
	regexInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			eventTagInput.focus();
		}
	});
	eventTagInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			save();
		}
	});

	deleteButton.onclick = () => {
		row.remove();
		save();
	};
}

function bindDescriptionSkipRow(row) {
	const regexInput = row.querySelector(Selectors.descriptionSkipRegex);
	const deleteButton = row.querySelector(Selectors.deleteButton);

	const sync = () => save();
	regexInput.addEventListener("blur", sync);
	regexInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			save();
		}
	});

	deleteButton.onclick = () => {
		row.remove();
		save();
	};
}
//endregion

//region Render
function renderHosts() {
	const hostList = document.getElementById(ElementIds.hostList);
	hostList.innerHTML = "";

	let btn;

	for (const [host, configuration] of Object.entries(hosts).sort()) {
		btn = document.createElement("button");
		btn.className = "list-group-item list-group-item-action host-item";
		if (host === selectedHost) btn.classList.add("active");
		btn.textContent = host;
		btn.onclick = () => selectHost(host, configuration);
		hostList.appendChild(btn);
	}
}

function renderEditor() {
	if (!selectedHost) {
		document.getElementById(ElementIds.editor).classList.toggle("d-none", true);
		return;
	}

	const configuration = hosts[selectedHost];
	document.getElementById(ElementIds.hostTitle).textContent = selectedHost;
	document.getElementById(ElementIds.stageInput).value = configuration[HostConfigKeys.stage] ?? "";
	document.getElementById(ElementIds.trackCreatedTagInput).value = configuration[HostConfigKeys.trackCreatedTag] ?? "";

	const projects = configuration[HostConfigKeys.projects] || {};
	const taskTags = configuration[HostConfigKeys.taskTags] || {};
	const durationTags = configuration[HostConfigKeys.durationTags] || {};
	const titleTags = configuration[HostConfigKeys.titleTags] || {};
	const descriptionSkip = configuration[HostConfigKeys.descriptionSkip] || [];

	const projectTable = document.getElementById(ElementIds.projectTable);
	projectTable.innerHTML = "";
	for (const [p, e] of Object.entries(projects).sort()) {
		renderProjectRow(p, e);
	}

	const taskTagTable = document.getElementById(ElementIds.taskTagTable);
	taskTagTable.innerHTML = "";
	for (const [tt, et] of Object.entries(taskTags).sort()) {
		renderTaskTagRow(tt, et);
	}

	const durationTagTable = document.getElementById(ElementIds.durationTagTable);
	durationTagTable.innerHTML = "";
	for (const [tt, value] of Object.entries(durationTags).sort()) {
		renderDurationTagRow(tt, value);
	}

	const titleTagTable = document.getElementById(ElementIds.titleTagTable);
	titleTagTable.innerHTML = "";
	for (const [regex, eventTag] of Object.entries(titleTags).sort()) {
		renderTitleTagRow(regex, eventTag);
	}

	const descriptionSkipTable = document.getElementById(ElementIds.descriptionSkipTable);
	descriptionSkipTable.innerHTML = "";
	for (const regex of descriptionSkip) {
		renderDescriptionSkipRow(regex);
	}

	document.getElementById(ElementIds.editor).classList.toggle("d-none", false);
}

function renderProjectRow(project, event) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
    <td><input type="number" min="1" step="1" class="form-control project-id" value="${project}"></td>
    <td><input type="number" min="1" step="1" class="form-control event-id" value="${event}"></td>
    <td><button class="btn btn-sm btn-outline-danger">Delete</button></td>`;
	bindProjectRow(tr);
	document.getElementById(ElementIds.projectTable).appendChild(tr);
    return tr
}

function renderTaskTagRow(taskTag, eventTag) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
    <td><input type="number" min="1" step="1" class="form-control task-tag-id" value="${taskTag}"></td>
    <td><input type="number" min="1" step="1" class="form-control event-tag-id" value="${eventTag}"></td>
    <td><button class="btn btn-sm btn-outline-danger">Delete</button></td>`;
	bindTaskTagRow(tr);
	document.getElementById(ElementIds.taskTagTable).appendChild(tr);
    return tr
}

function renderDurationTagRow(taskTag, duration) {
	const durationOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
	const selectedDuration = duration === undefined || duration === null || duration === "" ? 0 : duration;
	const tr = document.createElement("tr");
	tr.innerHTML = `
    <td><input type="number" min="1" step="1" class="form-control duration-task-tag-id" value="${taskTag}"></td>
    <td>
        <select class="form-select duration-value">
            ${durationOptions
			.map(
				(value) =>
					`<option value="${value}" ${String(value) === String(selectedDuration) ? "selected" : ""}>${value}</option>`
				)
				.join("")}
        </select>
    </td>
    <td><button class="btn btn-sm btn-outline-danger">Delete</button></td>`;
	bindDurationTagRow(tr);
	document.getElementById(ElementIds.durationTagTable).appendChild(tr);
    return tr
}

function renderTitleTagRow(regex, eventTag) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
    <td><input type="text" class="form-control title-regex" value="${regex}"></td>
    <td><input type="number" min="1" step="1" class="form-control title-event-tag-id" value="${eventTag}"></td>
    <td><button class="btn btn-sm btn-outline-danger">Delete</button></td>`;
	bindTitleTagRow(tr);
	document.getElementById(ElementIds.titleTagTable).appendChild(tr);
    return tr
}

function renderDescriptionSkipRow(regex) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
    <td><input type="text" class="form-control description-skip-regex" value="${regex}"></td>
    <td><button class="btn btn-sm btn-outline-danger">Delete</button></td>`;
	bindDescriptionSkipRow(tr);
	document.getElementById(ElementIds.descriptionSkipTable).appendChild(tr);
    return tr
}
//endregion

//region Storage
async function loadHosts() {
    const defaultHosts = {}
	const settings = await StorageSync.get(StorageKeys.settings);
	hosts = settings[StorageKeys.settings];
	return hosts || defaultHosts;
}

async function saveHosts() {
	await StorageSync.set({ [StorageKeys.settings]: hosts });
}
//endregion

//region Utils
const HostNamePattern = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

function isValidHostName(host) {
	return HostNamePattern.test(host);
}
//endregion

//region Import/Export
function importHost()   {
    uploadJson("current")
}

function importNewHost()    {
    uploadJson("new")
}

function exportJSON()   {
    if (!selectedHost) return
    downloadJson(`${selectedHost}.json`, {
		host: selectedHost,
		settings: hosts[selectedHost],
	});
}

function downloadJson(filename, data) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function uploadJson(mode) {
    document.getElementById("importFile").onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const data = JSON.parse(await file.text())
        if (!data.settings) {
            alert("Invalid file")
            return
        }

        const host = mode === "new" ? prompt("Host: ", data.host || "") : selectedHost
        if (!host) {
            alert("No host")
            return
        }
        hosts[host] = data.settings
        saveHosts()
        selectHost(host)
        e.target.value = ""
    }
    document.getElementById(ElementIds.importFile).click();
}
//endregion

load();
