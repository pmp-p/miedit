"use strict"

class MiTree {
    constructor(container, ribbon, nodes) {
        // Properties
        this.container = container
        this.treeWidget = container.find(".miedit-tree")
        this.tree = undefined
        this.children = {
            "move-locate": "Move cursor to an abolute position",
            "move-home": "Move cursor to first row, first column",
            "move-left": "Move cursor on the left",
            "move-up": "Move cursor on the preceding row",
            "move-down": "Move cursor on the next row",
            "move-right": "Move cursor on the right",
            "move-sol": "Move cursor to the first column of the current row",
            "clear-screen": "Clear screen",
            "clear-eol": "Clear till the end of the current row",
            "color-fg-0": "Set foreground color to black",
            "color-fg-1": "Set foreground color to red",
            "color-fg-2": "Set foreground color to green",
            "color-fg-3": "Set foreground color to yellow",
            "color-fg-4": "Set foreground color to blue",
            "color-fg-5": "Set foreground color to magenta",
            "color-fg-6": "Set foreground color to cyan",
            "color-fg-7": "Set foreground color to white",
            "color-bg-0": "Set background color to black",
            "color-bg-1": "Set background color to red",
            "color-bg-2": "Set background color to green",
            "color-bg-3": "Set background color to yellow",
            "color-bg-4": "Set background color to blue",
            "color-bg-5": "Set background color to magenta",
            "color-bg-6": "Set background color to cyan",
            "color-bg-7": "Set background color to white",
            "effect-normal-size": "Set normal size",
            "effect-double-size": "Set double size",
            "effect-double-width": "Set double width",
            "effect-double-height": "Set double height",
            "effect-blink-on": "Blink on",
            "effect-blink-off": "Blink off",
            "effect-invert-on": "Invert on",
            "effect-invert-off": "Invert off",
            "effect-underline-on": "Underline on",
            "effect-underline-off": "Underline off",
            "content-group": "Group",
            "content-string": "String",
            "content-block": "Block",
            "smgraph": "Semigraphic characters",
            "content-delay": "Delay"
        }

        // Initialize the tree widget
        const widgetTypes = {
            "#": {
                "max_children": 100,
                "max_depth": 5,
                "valid_children": Object.keys(this.children),
            },
        }

        Object.keys(this.children).forEach(child => {
            widgetTypes[child] = { "icon": "./icon/" + child + ".svg" }
            if(child !== "content-group") widgetTypes[child].valid_children = []
        })

        this.treeWidget.jstree({
            "core": { "check_callback": true, "data": nodes },
            "types": widgetTypes,
            "plugins": [ "dnd" , "types" ],
        })
        this.tree = $.jstree.reference(this.treeWidget)

        // Disable default behaviour of forms
        container.find("form").submit(e => { e.preventDefault() })

        container.autocallback(this)
        this.treeWidget.on("select_node.jstree", this, this.onSelect)

        ribbon.autocallback(this)

        container.find(".info-block").each(function() {
            $(this).text(this.pageName)
        })
    }

    hideForms() {
        this.container.find(".miedit-forms>*").hide()
    }

    showForm(selector, selected) {
        // Load form with node values
        let form = this.container.find(selector)
        if(form.length > 0) {
            form[0].reset()
            form.unserialize(selected.data["miedit-value"])
        } else {
            // No form available, defaults to empty form
            form = this.container.find(".miedit-forms .empty")
        }

        // Show the form
        form.show()
    }

    serialize() {
        return this.tree.get_json()
    }

    unserialize(nodes) {
        this.tree.core.data = nodes
    }

    onCreateTidget(event) {
        const that = event.data.that
        const param = event.data.param
        const newNode = {
            "text": that.children[param],
            "type": param,
            "data": {},
        }
        const currents = that.tree.get_selected(true)
        const parent = currents.length > 0 ? currents[0] : "#"
        that.tree.create_node(parent, newNode, "after")

        return false
    }

    onDelete(event) {
        const that = event.data.that
        const currents = that.tree.get_selected(true)
        currents.forEach(function(e) { that.tree.delete_node(e) })
        that.hideForms()

        return false
    }

    onSelect(event, data) {
        const selected = data.instance.get_node(data.selected[0])

        event.data.hideForms()
        event.data.showForm(".miedit-forms ." + selected.type, selected)
    }

    onSubmit(event) {
        // Save node values
        const currents = event.data.that.tree.get_selected(true)
        currents[0].data["miedit-value"] = $(this).serialize()
    }
}
