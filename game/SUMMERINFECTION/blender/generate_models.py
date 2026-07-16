import bpy
import math
import os
import sys
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(ROOT, "models")
BLEND_DIR = os.path.join(ROOT, "blender", "sources")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(BLEND_DIR, exist_ok=True)

SPECS = {
    "player_red_punk": {
        "kind": "player", "skin": (0.62, 0.34, 0.23, 1), "top": (0.55, 0.025, 0.045, 1),
        "legs": (0.035, 0.04, 0.055, 1), "hair": (0.055, 0.008, 0.012, 1), "accent": (0.9, 0.015, 0.035, 1),
    },
    "infected_girl": {
        "kind": "boss", "skin": (0.50, 0.34, 0.29, 1), "top": (0.018, 0.018, 0.025, 1),
        "legs": (0.025, 0.03, 0.045, 1), "hair": (0.008, 0.006, 0.009, 1), "accent": (0.42, 0.015, 0.035, 1),
    },
    "zombie_a": {
        "kind": "zombie", "skin": (0.34, 0.32, 0.23, 1), "top": (0.22, 0.20, 0.12, 1),
        "legs": (0.055, 0.06, 0.065, 1), "hair": (0.06, 0.045, 0.025, 1), "accent": (0.22, 0.05, 0.035, 1),
    },
    "zombie_b": {
        "kind": "zombie", "skin": (0.24, 0.34, 0.30, 1), "top": (0.08, 0.20, 0.18, 1),
        "legs": (0.045, 0.055, 0.06, 1), "hair": (0.12, 0.10, 0.075, 1), "accent": (0.28, 0.06, 0.04, 1),
    },
    "zombie_c": {
        "kind": "zombie", "skin": (0.42, 0.37, 0.31, 1), "top": (0.30, 0.24, 0.17, 1),
        "legs": (0.045, 0.045, 0.05, 1), "hair": (0.045, 0.032, 0.025, 1), "accent": (0.20, 0.04, 0.03, 1),
    },
}

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.actions):
        for item in list(block):
            block.remove(item)

def material(name, color, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 1.0
    if emission:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = 2.0
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emission
    return mat

def finish_object(obj, name, mat, bone, armature):
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new(name="SI_Armature", type="ARMATURE")
    modifier.object = armature
    return obj
def cube(name, location, scale, mat, bone, armature, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    return finish_object(obj, name, mat, bone, armature)

def cylinder(name, location, radius, depth, mat, bone, armature, rotation=(0, 0, 0), vertices=5):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius * 0.82, depth=depth, location=location, rotation=rotation)
    return finish_object(bpy.context.object, name, mat, bone, armature)

def ico(name, location, radius, mat, bone, armature, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=location)
    obj = bpy.context.object
    obj.scale = scale
    return finish_object(obj, name, mat, bone, armature)

def create_armature():
    data = bpy.data.armatures.new("SI_Rig")
    arm = bpy.data.objects.new("SI_Rig", data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = {
        "root": ((0, 0, 0), (0, 0, 0.3), None),
        "hips": ((0, 0, 0.85), (0, 0, 1.3), "root"),
        "torso": ((0, 0, 1.25), (0, 0, 2.25), "hips"),
        "head": ((0, 0, 2.25), (0, 0, 3.05), "torso"),
        "arm.L": ((-0.42, 0, 2.12), (-0.58, 0, 1.28), "torso"),
        "arm.R": ((0.42, 0, 2.12), (0.58, 0, 1.28), "torso"),
        "leg.L": ((-0.21, 0, 1.18), (-0.21, 0, 0.12), "hips"),
        "leg.R": ((0.21, 0, 1.18), (0.21, 0, 0.12), "hips"),
    }
    made = {}
    for name, (head, tail, parent) in bones.items():
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent:
            bone.parent = made[parent]
        made[name] = bone
    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in arm.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm

def add_action(arm, name, frames):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = action
    for frame, values in frames:
        for bone_name, rotation, location in values:
            bone = arm.pose.bones[bone_name]
            bone.rotation_euler = rotation
            bone.location = location
            bone.keyframe_insert("rotation_euler", frame=frame, group=bone_name)
            bone.keyframe_insert("location", frame=frame, group=bone_name)
    action.frame_range = (frames[0][0], frames[-1][0])
    return action

def create_actions(arm, zombie=False):
    zero = Vector((0, 0, 0))
    add_action(arm, "idle", [
        (1, [("torso", (0, 0, -0.02), zero), ("head", (0, 0, 0.02), zero)]),
        (13, [("torso", (0.025, 0, 0.02), (0, 0, 0.025)), ("head", (-0.018, 0, -0.02), zero)]),
        (25, [("torso", (0, 0, -0.02), zero), ("head", (0, 0, 0.02), zero)]),
    ])
    walk = []
    for frame, swing in ((1, -0.58), (7, 0), (13, 0.58), (19, 0), (25, -0.58)):
        arm_base = -0.65 if zombie else 0
        walk.append((frame, [
            ("leg.L", (swing, 0, 0), zero), ("leg.R", (-swing, 0, 0), zero),
            ("arm.L", (-swing * 0.7 + arm_base, 0, 0), zero),
            ("arm.R", (swing * 0.7 + arm_base, 0, 0), zero),
            ("hips", (0, 0, 0), (0, 0, abs(swing) * 0.04)),
        ]))
    add_action(arm, "walk", walk)
    add_action(arm, "hit", [
        (1, [("torso", (0, 0, 0), zero), ("head", (0, 0, 0), zero)]),
        (5, [("torso", (-0.32, 0.08, 0.14), (0, 0, -0.06)), ("head", (0.28, 0, -0.1), zero)]),
        (12, [("torso", (0, 0, 0), zero), ("head", (0, 0, 0), zero)]),
    ])
    add_action(arm, "death", [
        (1, [("root", (0, 0, 0), zero), ("torso", (0, 0, 0), zero)]),
        (15, [("root", (0.65, 0, -0.35), (0, 0, -0.38)), ("torso", (-0.45, 0.1, 0), zero)]),
        (30, [("root", (1.48, 0, -0.45), (0, 0, -0.78)), ("torso", (-0.65, 0.1, 0), zero)]),
    ])
    arm.animation_data.action = None

def build_model(name, spec):
    clear_scene()
    arm = create_armature()
    skin = material("skin", spec["skin"])
    top = material("top", spec["top"])
    legs = material("legs", spec["legs"])
    hair = material("hair", spec["hair"])
    accent = material("accent", spec["accent"])
    black = material("black", (0.012, 0.012, 0.018, 1))
    kind = spec["kind"]
    cube("hips", (0, 0, 1.18), (0.64, 0.36, 0.34), legs, "hips", arm)
    cylinder("torso", (0, 0, 1.78), 0.48, 0.98, top, "torso", arm)
    cylinder("neck", (0, 0, 2.35), 0.15, 0.24, skin, "head", arm)
    ico("head", (0, 0, 2.72), 0.38, skin, "head", arm, (0.92, 0.88, 1.08))
    ico("hair_cap", (0, -0.01, 2.83), 0.405, hair, "head", arm, (1.0, 0.92, 1.05))
    cube("fringe", (0, -0.34, 2.88), (0.70, 0.10, 0.17), hair, "head", arm)
    cylinder("arm_l", (-0.54, 0, 1.72), 0.13, 0.86, skin if kind != "zombie" else top, "arm.L", arm, rotation=(0, 0.10, 0))
    cylinder("arm_r", (0.54, 0, 1.72), 0.13, 0.86, skin if kind != "zombie" else top, "arm.R", arm, rotation=(0, -0.10, 0))
    cylinder("leg_l", (-0.22, 0, 0.65), 0.17, 1.08, legs, "leg.L", arm)
    cylinder("leg_r", (0.22, 0, 0.65), 0.17, 1.08, legs, "leg.R", arm)
    cube("boot_l", (-0.22, -0.08, 0.10), (0.30, 0.52, 0.18), black, "leg.L", arm)
    cube("boot_r", (0.22, -0.08, 0.10), (0.30, 0.52, 0.18), black, "leg.R", arm)
    if kind == "player":
        cube("jacket_l", (-0.42, -0.25, 1.78), (0.14, 0.08, 0.72), accent, "torso", arm)
        cube("jacket_r", (0.42, -0.25, 1.78), (0.14, 0.08, 0.72), accent, "torso", arm)
        cube("hair_red", (-0.29, -0.35, 2.68), (0.09, 0.08, 0.48), accent, "head", arm)
    elif kind == "boss":
        cube("plaid", (0, -0.18, 1.18), (0.88, 0.15, 0.14), accent, "hips", arm)
        cube("inner_color", (-0.28, -0.34, 2.68), (0.08, 0.08, 0.46), accent, "head", arm)
        eye = material("eye_red", (0.9, 0.005, 0.01, 1), (1, 0, 0, 1))
        cube("eye_l", (-0.12, -0.345, 2.73), (0.075, 0.035, 0.045), eye, "head", arm)
        cube("eye_r", (0.12, -0.345, 2.73), (0.075, 0.035, 0.045), eye, "head", arm)
        cube("mouth_blood", (0.18, -0.35, 2.54), (0.09, 0.025, 0.05), accent, "head", arm)
    else:
        arm.pose.bones["torso"].rotation_euler[1] = (hash(name) % 7 - 3) * 0.025
        cube("shirt_damage", (0.2, -0.40, 1.75), (0.20, 0.025, 0.12), accent, "torso", arm, rotation=(0.1, 0, 0.25))
    create_actions(arm, kind == "zombie")
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 30
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    bpy.context.scene.world.color = (0.02, 0.02, 0.025)
    blend_path = os.path.join(BLEND_DIR, name + ".blend")
    glb_path = os.path.join(MODEL_DIR, name + ".glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    kwargs = dict(filepath=glb_path, export_format="GLB", export_animations=True, export_yup=True, export_apply=True)
    properties = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    if "export_animation_mode" in properties:
        kwargs["export_animation_mode"] = "ACTIONS"
    if "export_anim_single_armature" in properties:
        kwargs["export_anim_single_armature"] = True
    if "export_reset_pose_bones" in properties:
        kwargs["export_reset_pose_bones"] = True
    bpy.ops.export_scene.gltf(**kwargs)
    print("EXPORTED", name, glb_path)

for model_name, model_spec in SPECS.items():
    build_model(model_name, model_spec)

print("SUMMER INFECTION MODELS COMPLETE")
