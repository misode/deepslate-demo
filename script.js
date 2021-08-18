const assets = JSON.parse(stringifiedAssets)

const blockDefinitions = {}
Object.keys(assets.blockstates).forEach(id => {
  blockDefinitions['minecraft:' + id] = deepslate.BlockDefinition.fromJson(id, assets.blockstates[id])
})

const blockModels = {}
Object.keys(assets.models).forEach(id => {
  blockModels['minecraft:' + id] = deepslate.BlockModel.fromJson(id, assets.models[id])
})
Object.values(blockModels).forEach(m => m.flatten({ getBlockModel: id => blockModels[id] }))

const image = document.getElementById('atlas')
if (image.complete) {
  loaded()
} else {
  image.addEventListener('load', loaded)
}

function loaded() {
	const atlasCanvas = document.createElement('canvas')
	atlasCanvas.width = image.width
	atlasCanvas.height = image.height
	const atlasCtx = atlasCanvas.getContext('2d')
	atlasCtx.drawImage(image, 0, 0)
	const atlasData = atlasCtx.getImageData(0, 0, atlasCanvas.width, atlasCanvas.height)
	const part = 16 / atlasData.width
	const idMap = {}
	Object.keys(assets.textures).forEach(t => {
		const [u, v] = assets.textures[t]
		idMap['minecraft:' + t] = [u, v, u + part, v + part]
	})
	const textureAtlas = new deepslate.TextureAtlas(atlasData, idMap)

	const resources = {
		getBlockDefinition(id) {
			return blockDefinitions[id]
		},
		getBlockModel(id) {
			return blockModels[id]
		},
		getTextureUV(id) {
			return textureAtlas.getTextureUV(id)
		},
		getTextureAtlas() {
			return textureAtlas.getTextureAtlas()
		},
		getBlockFlags(id) {
			return {
				opaque: false
			}
		},
		getBlockProperties(id) {
			return null
		},
		getDefaultBlockProperties(id) {
			return null
		}
	}
	
	const structure = new deepslate.Structure([2, 3, 2])
	structure.addBlock([1, 0, 1], "minecraft:stone")
	structure.addBlock([1, 1, 1], "minecraft:cake", { "bites": "3" })
	structure.addBlock([0, 0, 1], "minecraft:wall_torch", { "facing": "west" })
	
	const canvas = document.getElementById('canvas')
	const gl = canvas.getContext('webgl')
	
	const renderer = new deepslate.StructureRenderer(gl, structure, resources)
	
	const { mat4 } = glMatrix
	
	const view = mat4.create()
	mat4.rotateY(view, view, 0.2)
	mat4.translate(view, view, [-0.5, -1, -5])
	
	renderer.drawStructure(view)	
}
