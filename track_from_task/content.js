async function loadDependencies(dependencies) {
    const resolvedDependencies = {};

    try {
        for (const dependency of dependencies) {
            const module = await odoo.loader.modules.get(dependency.from);
            for (const importName of dependency.imports) {
                resolvedDependencies[importName] = module[importName];
            }
        }
    } catch (e) {
        console.warn(e)
        return null
    }

    return resolvedDependencies;
}

const views = [
    {
        name: 'project.task.form.track',
        model: 'project.task',
        jsClass: 'project_task_form',
        arch: (params) => `<t>
            <xpath expr="//field[@name='stage_id']" position="before">
                <button
                    string="Create Track"
                    class="tft_create_track_button btn btn-info"
                    invisible="project_id not in (${params.project_ids.join(',')},) or ${params.created_tag_id} in tag_ids"
                    type="button" title="This button is not standard, it's provided by a 'Odoo Task → Event Track' Chrome Extension"
                />
            </xpath>
        </t>`
    }
]

const HostConfigKeys = {
    stage: 'stage',
    projects: 'projects',
    taskTags: 'taskTags',
    durationTags: 'durationTags',
    titleTags: 'titleTags',
    descriptionSkip: 'descriptionSkip',
    trackCreatedTag: 'trackCreatedTag',
};

let hostOptions = {};



function getCurrentHostConfig(showAlert=false) {
    if (!hostOptions) {
        if (showAlert) alert("Nothing configured")
        return {}
    }
    const host = hostOptions[window.location.hostname] || hostOptions[window.location.host];
    if (!host && showAlert) alert("Unknow host")
    return host || {}
}

async function loadHostOptions() {
    return new Promise((resolve, _) => {
        const listener = (e) => {
            console.log(e)
            if (e.data.type !== "HOSTS_RESPONSE") return

            window.removeEventListener("message", listener)
            resolve(e.data.hosts)
        }
        window.addEventListener("message", listener)
        window.postMessage({ type: "GET_HOSTS" });
    })
}

function getProjectDefaultEventId(record, config) {
    const projectId = record.data.project_id.id
    if (!projectId) return undefined;
    return config[HostConfigKeys.projects]?.[projectId];
}

function getDurationForTags(tagIds, config) {
    const durationMap = config[HostConfigKeys.durationTags] || {};
    let duration = 0;
    for (const id of tagIds) {
        duration = durationMap[id] ?? duration;
    }
    return duration;
}

function getMappedTagIds(record, config) {
    const tags = [];
    const titleTags = config[HostConfigKeys.titleTags] || {};
    const title = record.data.name || "";
    for (const [pattern, eventTag] of Object.entries(titleTags)) {
        try {
            if (new RegExp(pattern).test(title)) {
                tags.push(eventTag);
            }
        } catch (e) {
            console.warn("Invalid title regex", pattern, e);
        }
    }

    const taskTagMap = config[HostConfigKeys.taskTags] || {};
    for (const id of record.data.tag_ids.resIds || []) {
        const eventTag = taskTagMap[id];
        if (eventTag) {
            tags.push(eventTag);
        }
    }

    return [...new Set(tags)].filter(Boolean);
}

function shouldSkipDescription(description, config) {
    if (!description) return false;
    const skipPatterns = config[HostConfigKeys.descriptionSkip] || [];
    for (const pattern of skipPatterns) {
        try {
            if (new RegExp(pattern).test(String(description))) {
                return true;
            }
        } catch (e) {
            console.warn("Invalid descriptionSkip regex", pattern, e);
        }
    }
    return false;
}

function patchView(parserPrototype, { patch, applyInheritance }) {
    const parser = new DOMParser();
    const config = getCurrentHostConfig()
    const project_ids = config[HostConfigKeys.projects] ? Object.keys(config[HostConfigKeys.projects]) : []
    const created_tag_id = config[HostConfigKeys.trackCreatedTag] || 0

    const xpathPatch = {
        parse(xmlDoc, models, modelName) {
            const xpathViews = views.filter(v => v.model === modelName && v.jsClass === xmlDoc.getAttribute("js_class")).map(v => v.arch({
                project_ids: project_ids.length > 0 ? project_ids : [0],
                created_tag_id: created_tag_id
            }))
            for (const xpathXML of xpathViews)  {
                applyInheritance(xmlDoc, parser.parseFromString(xpathXML, "text/xml").documentElement, "track_from_task/content.js");
            }
            return super.parse(xmlDoc, models, modelName)
        }
    }

    patch(parserPrototype, xpathPatch)
}

function patchProjectTaskFormController(FormController, { patch, onMounted, markup, x2ManyCommands }) {
    patch(FormController.prototype, {
        setup() {
            super.setup();

            onMounted(() => {
                const bindButton = () => {
                    const btn = document.querySelector(".tft_create_track_button");
                    if (btn && !btn.dataset.tftBound) {
                        btn.dataset.tftBound = "1";
                        btn.onclick = () => this.openNewTrackForm();
                    }
                };

                bindButton();

                // onMounted is called once, need to observe DOM to handle button visibility
                this._observer = new MutationObserver(bindButton);
                this._observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            });
        },

        async onTrackCreated(result) {
            if (!result) {
                console.warn("Missing result, skipping")
                return
            }
            const record = this.model.root
            const trackURL = `${window.location.origin}${window.location.pathname}/event.track/${result.resId}${window.location.search}`

            const thread = this.mailStore["mail.thread"].insert({
                model: "project.task",
                id: this.model.root.resId,
            });

            message = await thread.post(
                markup(`<p>Track created: <a href="${trackURL}">${record.data.name}</a></p>`),
                {
                    message_type: "comment",
                    isNote: true,
                },
            );
            await thread.messagePin(message)

            const config = getCurrentHostConfig();
            const createdTagId = config[HostConfigKeys.trackCreatedTag];
            if (createdTagId) {
                await this.orm.write("project.task", [record.resId], {tag_ids: [[x2ManyCommands.LINK, createdTagId]]});
                await record.load?.();
            }
        },

        async openNewTrackForm() {
            const record = this.model.root
            console.log(record)

            const userIds = this.model.root.data.user_ids.resIds
            let speakerPartner, speakerBioName = ""

            if (userIds.length > 0) {
                const users = await this.orm.read("res.users", userIds, ["partner_id"])
                const partners = users.map(u => u.partner_id)

                speakerPartner = partners[0][0]
                speakerBioName = partners.map(p => p[1].replace(/\s*\([^)]*\)\s*$/, "")).join(" & ")
            }

            const config = getCurrentHostConfig(true)
            const tags = getMappedTagIds(record, config)
            const duration = getDurationForTags(record.data.tag_ids.resIds || [], config)
            const defaultEventId = getProjectDefaultEventId(record, config)
            const defaultStageId = config[HostConfigKeys.stage]
            const defaultDescription = shouldSkipDescription(record.data.description || "", config) ? "" : record.data.description

            await this.env.services.action.doAction({
                type: "ir.actions.act_window",
                res_model: "event.track",
                views: [[false, "form"]],
                target: "new",
                context: {
                    default_event_id: defaultEventId,
                    default_stage_id: defaultStageId,
                    default_name: record.data.name,
                    default_duration: duration,
                    default_tag_ids: tags,
                    default_description: defaultDescription,
                    default_partner_id: speakerPartner,
                    default_partner_name: speakerBioName,
                    default_partner_phone: "",
                },
            }, { props: { onSave: (r) => {
                this.onTrackCreated(r)
                return this.env.services.action.doAction({ type: "ir.actions.act_window_close" });
            }}});
        }
    })
}

console.log("Odoo Chrome Utils: Loading content script...");
load(5);

async function load(retry) {
    if (typeof odoo === 'undefined') return
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const root = odoo.__WOWL_DEBUG__ ? odoo.__WOWL_DEBUG__.root : null;
    if (!root) {
        if (retry > 0) {
            return load(retry-1)
        }
        console.log("No root")
        return;
    }

    hostOptions = await loadHostOptions();

    const dependencies = await loadDependencies([
        {from: "@web/core/utils/patch", imports: ["patch"]},
        {from: "@web/core/utils/hooks", imports: ["useService"]},
        {from: "@web/core/template_inheritance", imports: ["applyInheritance"]},
        {from: "@odoo/owl", imports: ["onMounted", "markup"]},
        {from: "@web/views/form/form_arch_parser", imports: ["FormArchParser"]},
        {from: "@web/core/orm_service", imports: ["x2ManyCommands"]},
        {from: "@project/views/project_task_form/project_task_form_controller", imports: ["ProjectTaskFormController"]},
    ])
    if (!dependencies) {
        console.warn("Fail to load dependencies")
        return
    }
    const { FormArchParser, ProjectTaskFormController } = dependencies
    patchView(FormArchParser.prototype, dependencies)
    patchProjectTaskFormController(ProjectTaskFormController, dependencies)
}
