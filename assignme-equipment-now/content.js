const MODEL = "maintenance.equipment";
const BUTTON_ID = "assignmeequipment_action_assign_to_me";
const FAKE_DATA_TITLE = `This element is not part of the original application; it was added artificially by a Chrome extension.
If unsure, please reload the page!`;
const FAKE_DATA_CLASS = "fake_data";

let current_url = null;

const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		// When chatter changes that means we have maybe switched records
		if (!mutation.target.classList.contains("o-mail-Message-textContent") && !mutation.target.classList.contains("o-mail-ActionList-button")) {
			continue;
		}
		if (current_url === window.location.href) continue;
		current_url = window.location.href;
		cleanUI();
		if (isEquipmentFormViewReady()) {
			addAssignMeButtonToDom();
		}
		return;
	}
});

observer.observe(document.documentElement, { childList: true, subtree: true });

function isEquipmentFormViewReady() {
	const technicianField = document.getElementById("technician_user_id_0");
	return technicianField;
}

function addAssignMeButtonToDom() {
	const userID = getUserID();
	if (!userID) {
		console.error("No user ID found in session info");
		return;
	}
	const equipmentID = getEquipmentID();
	if (!equipmentID) {
		console.error("No equipment ID found in URL");
		return;
	}

	const assignBtn = document.createElement("button");
	assignBtn.className = "btn btn-sm btn-secondary mb-1";
	assignBtn.name = BUTTON_ID;
	assignBtn.type = "button";
	const prefix = window.location.href.includes("debug=1")
		? ` (${MODEL},${equipmentID})`
		: ` (${equipmentID})`;
	assignBtn.textContent = `Assign to me${prefix}`;
	assignBtn.onclick = () => assignUserNow();

	const field = document.getElementById("technician_user_id_0");
	if (field) {
		const parent =
			field.parentElement.parentElement.parentElement.parentElement
				.parentElement;
		parent.insertBefore(assignBtn, parent.firstChild);
	}
}

function assignUserNow() {
	const userID = getUserID();
	if (!userID) {
		console.error("No user ID found in session info");
		return;
	}
	const equipmentID = getEquipmentID();
	if (!equipmentID) {
		console.error("No equipment ID found in URL");
		return;
	}

	const today = new Date().toISOString().split("T")[0];

	writeOdoo(MODEL, equipmentID, {
		technician_user_id: userID,
		assign_date: today,
	}).then((success) => {
		if (success) {
			console.log("Equipment assigned successfully", { equipmentID, userID });
			cleanUI();
			addUserIDToDom();
			maybeScream();
		} else {
			alert("Failed to assign equipment. Please try again.");
			console.error("Failed to assign equipment");
		}
	});
}

function getUserID() {
	const scripts = document.querySelectorAll('script[type="text/javascript"]');
	const script = Array.from(scripts).find((s) =>
		s.innerText.includes("odoo.__session_info__"),
	);
	if (!script) return;

	const regex = /odoo\.__session_info__\s*=\s*(\{.*\});/;
	const match = script.innerText.match(regex);
	const session = match ? JSON.parse(match[1]) : null;
	return session ? session.uid : null;
}

function getEquipmentID() {
	const pathParts = window.location.pathname.split("/");
	const id = parseInt(pathParts[pathParts.length - 1], 10);
	return Number.isInteger(id) && id > 0 ? id : null;
}

async function writeOdoo(model, recordID, dataWrite) {
	const response = await fetch(`/web/dataset/call_kw/${model}/write`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			method: "call",
			id: 1,
			params: {
				model,
				method: "write",
				args: [[recordID], dataWrite],
				kwargs: { context: {} },
			},
		}),
	});

	const data = await response.json();
	if (data.error) {
		console.error("Error writing to Odoo:", data.error);
		return false;
	}
	return data.result;
}

function cleanUI() {
	for (const btn of [...document.getElementsByName(BUTTON_ID)]) {
		btn.remove();
	}
	for (const el of document.querySelectorAll(`.${FAKE_DATA_CLASS}`)) {
		el.style.backgroundColor = "";
		el.style.border = "";
		el.style.borderRadius = "";
		el.title = "";
		if (
			el.tagName === "INPUT" &&
			el.value.startsWith("_") &&
			el.value.endsWith("_")
		) {
			el.value = "";
		}
		el.classList.remove(FAKE_DATA_CLASS);
	}
}

function addUserIDToDom() {
	const userName =
		document
			.querySelector(
				".o_user_avatar ~ .oe_topbar_name, .oe_topbar_avatar ~ .oe_topbar_name, .o_user_menu .oe_topbar_name",
			)
			?.firstChild?.nodeValue?.trim() || "Technician";

	const userIDField = document.getElementById("technician_user_id_0");
	if (userIDField) {
		userIDField.value = `_${userName}_`;
		addFakeStyle(userIDField);
	}

	const assignDateField = document.getElementById("assign_date_0");
	if (assignDateField) {
		assignDateField.value = `_${new Date().toLocaleDateString()}_`;
		assignDateField.innerText = `_${new Date().toLocaleDateString()}_`;
		addFakeStyle(assignDateField);
	}
}

function addFakeStyle(element) {
	element.title = FAKE_DATA_TITLE;
	element.style.backgroundColor = "rgba(252, 163, 17, 0.25)";
	element.style.border = "1px dashed rgba(252, 163, 17, 0.75)";
	element.style.borderRadius = "4px";
	element.classList.add(FAKE_DATA_CLASS);
}
