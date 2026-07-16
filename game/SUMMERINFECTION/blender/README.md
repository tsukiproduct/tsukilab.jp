# SUMMER INFECTION Blender Models

Generated assets:

- models/player_red_punk.glb
- models/infected_girl.glb
- models/zombie_a.glb
- models/zombie_b.glb
- models/zombie_c.glb

Editable Blender sources are stored in blender/sources/.

Every character uses the same eight-bone rig and contains four actions:

- idle
- walk
- hit
- death

Regenerate all files with Blender 5.1:

~~~powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python ".\game\blender\generate_models.py"
~~~

Validate exported GLB files:

~~~powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python ".\game\blender\validate_models.py"
~~~

Render the lineup preview:

~~~powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python ".\game\blender\render_preview.py"
~~~
