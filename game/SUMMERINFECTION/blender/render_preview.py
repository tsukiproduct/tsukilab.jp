import bpy
import glob
import math
import os
from mathutils import Vector

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
paths = [
    os.path.join(root, "models", "player_red_punk.glb"),
    os.path.join(root, "models", "infected_girl.glb"),
    os.path.join(root, "models", "zombie_a.glb"),
    os.path.join(root, "models", "zombie_b.glb"),
    os.path.join(root, "models", "zombie_c.glb"),
]
labels = ["PLAYER", "INFECTED GIRL", "ZOMBIE A", "ZOMBIE B", "ZOMBIE C"]
bpy.ops.wm.read_factory_settings(use_empty=True)

for index, path in enumerate(paths):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    created = [obj for obj in bpy.context.scene.objects if obj not in before and obj.parent is None]
    root_empty = bpy.data.objects.new("preview_" + str(index), None)
    bpy.context.collection.objects.link(root_empty)
    root_empty.location.x = (index - 2) * 2.05
    for obj in created:
        obj.parent = root_empty
    bpy.ops.object.text_add(location=((index - 2) * 2.05, 0.35, 3.55), rotation=(math.radians(90), 0, 0))
    text = bpy.context.object
    text.data.body = labels[index]
    text.data.align_x = "CENTER"
    text.data.size = 0.23
    text.data.extrude = 0.005

bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.02))
floor = bpy.context.object
floor_mat = bpy.data.materials.new("floor")
floor_mat.diffuse_color = (0.025, 0.025, 0.03, 1)
floor.data.materials.append(floor_mat)

bpy.ops.object.camera_add(location=(10.5, -17.5, 7.2))
camera = bpy.context.object
direction = Vector((0, 0, 1.55)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 56
bpy.context.scene.camera = camera

for location, energy, color, size in [
    ((-7, -8, 10), 1300, (1.0, 0.72, 0.62), 7),
    ((8, 2, 7), 1000, (0.42, 0.58, 1.0), 6),
    ((0, -1, 11), 900, (0.9, 0.9, 0.85), 5),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.color = color
    light.data.shape = "DISK"
    light.data.size = size
    light.rotation_euler = (0, 0, 0)
    light.rotation_euler = (Vector((0, 0, 1.4)) - light.location).to_track_quat("-Z", "Y").to_euler()

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.join(root, "blender", "model_preview.png")
scene.render.film_transparent = False
if scene.world is None:
    scene.world = bpy.data.worlds.new('Preview World')
scene.world.color = (0.008, 0.008, 0.012)
scene.view_settings.look = "AgX - Medium High Contrast"
bpy.ops.render.render(write_still=True)
print("PREVIEW", scene.render.filepath)
