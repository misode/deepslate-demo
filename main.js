const { mat4 } = glMatrix

const image = document.getElementById('atlas')
if (image.complete) {
  loaded()
} else {
  image.addEventListener('load', loaded)
}

function loaded() {
	const blockDefinitions = {}
	Object.keys(assets.blockstates).forEach(id => {
		blockDefinitions['minecraft:' + id] = deepslate.BlockDefinition.fromJson(id, assets.blockstates[id])
	})

	const blockModels = {}
	Object.keys(assets.models).forEach(id => {
		blockModels['minecraft:' + id] = deepslate.BlockModel.fromJson(id, assets.models[id])
	})
	Object.values(blockModels).forEach(m => m.flatten({ getBlockModel: id => blockModels[id] }))

	const atlasCanvas = document.createElement('canvas')
	atlasCanvas.width = image.width
	atlasCanvas.height = image.height
	const atlasCtx = atlasCanvas.getContext('2d')
	atlasCtx.drawImage(image, 0, 0)
	const atlasData = atlasCtx.getImageData(0, 0, atlasCanvas.width, atlasCanvas.height)
	const part = 16 / atlasData.width
	const idMap = {}
	Object.keys(assets.textures).forEach(id => {
		const [u, v] = assets.textures[id]
		idMap['minecraft:' + id] = [u, v, u + part, v + part]
	})
	const textureAtlas = new deepslate.TextureAtlas(atlasData, idMap)

	const resources = {
		getBlockDefinition(id) { return blockDefinitions[id] },
		getBlockModel(id) { return blockModels[id] },
		getTextureUV(id) { return textureAtlas.getTextureUV(id) },
		getTextureAtlas() { return textureAtlas.getTextureAtlas() },
		getBlockFlags(id) { return { opaque: opaqueBlocks.has(id) } },
		getBlockProperties(id) { return null },
		getDefaultBlockProperties(id) { return null },
	}

	const structure = new deepslate.Structure([3, 2, 1])
	const size = structure.getSize()
	structure.addBlock([1, 0, 0], "minecraft:stone")
	structure.addBlock([2, 0, 0], "minecraft:grass_block", { "snowy": "false" })
	structure.addBlock([1, 1, 0], "minecraft:cake", { "bites": "3" })
	structure.addBlock([0, 0, 0], "minecraft:wall_torch", { "facing": "west" })

	const canvas = document.getElementById('canvas')
	const gl = canvas.getContext('webgl')
	const renderer = new deepslate.StructureRenderer(gl, structure, resources)

	let viewDist = 4
	let xRotation = 0.8
	let yRotation = 0.5

	function render() {
		yRotation = yRotation % (Math.PI * 2)
		xRotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xRotation))
		viewDist = Math.max(1, Math.min(20, viewDist))

		const view = mat4.create()
		mat4.translate(view, view, [0, 0, -viewDist])
		mat4.rotate(view, view, xRotation, [1, 0, 0])
		mat4.rotate(view, view, yRotation, [0, 1, 0])
		mat4.translate(view, view, [-size[0] / 2, -size[1] / 2, -size[2] / 2])

		renderer.drawStructure(view)
	}
	requestAnimationFrame(render)

	let dragPos = null
	canvas.addEventListener('mousedown', evt => {
		if (evt.button === 0) {
			dragPos = [evt.clientX, evt.clientY]
		}
	})
	canvas.addEventListener('mousemove', evt => {
		if (dragPos) {
			yRotation += (evt.clientX - dragPos[0]) / 100
			xRotation += (evt.clientY - dragPos[1]) / 100
			dragPos = [evt.clientX, evt.clientY]
			requestAnimationFrame(render)
		}
	})
	canvas.addEventListener('mouseup', () => {
		dragPos = null
	})
	canvas.addEventListener('wheel', evt => {
		evt.preventDefault()
		viewDist += evt.deltaY / 100
		requestAnimationFrame(render)
	})

}
