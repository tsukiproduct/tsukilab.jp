import bpy
import glob
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for path in sorted(glob.glob(os.path.join(root, "models", "*.glb"))):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    actions = sorted(action.name for action in bpy.data.actions)
    print("VALIDATE", os.path.basename(path), "meshes=", len(meshes), "armatures=", len(armatures), "actions=", actions)
    if not meshes or not armatures:
        raise RuntimeError("Missing mesh or armature: " + path)
    for required in ("idle", "walk", "hit", "death"):
        if not any(required in name.lower() for name in actions):
            raise RuntimeError("Missing animation " + required + ": " + path)
print("MODEL VALIDATION COMPLETE")
