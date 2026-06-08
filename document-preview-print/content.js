function overrideStyles() {
	const styleTags = document.getElementsByTagName("style");

	for (const style of styleTags) {
		if (style.innerHTML.includes('button#printButton,button#secondaryPrint') && !style.dataset.overridden) {
			css = style.innerHTML
			css += '\nbutton#printButton,button#secondaryPrint { display: flex !important; color: goldenrod !important; }'
			css += '\nbutton#printButton::before,button#secondaryPrint::before { background-color: goldenrod !important; }'

			style.dataset.overridden = "true";
			style.innerHTML = css
            console.debug('Odoo/PDF.js Style overrided')
		}
	}
}

overrideStyles();

const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		if (mutation.addedNodes.length) overrideStyles();
	}
});

observer.observe(document.documentElement, { childList: true, subtree: true });
