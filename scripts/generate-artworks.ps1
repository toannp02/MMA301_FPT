Add-Type -AssemblyName System.Drawing
$names = @('Terracotta Sun','Quiet Arches','Sage Horizon','Indigo Tide','Ochre Fields','Clay Moon','Forest Layers','Blue Balance','Desert Window','Evening Forms','Olive Rhythm','Rose Geometry')
$palettes = @(@('#BA654B','#E6B890','#40382F'),@('#D3AD92','#78634E','#F4DED0'),@('#A6AF91','#566B58','#DBD9BD'),@('#426579','#243F55','#AECAD2'))
for ($i = 0; $i -lt 12; $i++) {
 $bmp = [System.Drawing.Bitmap]::new(600,900)
 $g = [System.Drawing.Graphics]::FromImage($bmp)
 $g.SmoothingMode = 'AntiAlias'
 $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#F2E9DC'))
 $p = $palettes[$i % 4]
 $brushes = @($p | ForEach-Object { [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($_)) })
 $g.FillEllipse($brushes[0],(70+($i*23)%140),90,340,340)
 $g.FillRectangle($brushes[1],65,(410+($i*17)%90),470,290)
 $g.FillEllipse($brushes[2],(110+($i*19)%160),330,230,410)
 $g.FillRectangle([System.Drawing.Brushes]::Linen,0,760,600,140)
 $g.DrawLine([System.Drawing.Pens]::White,45,820,555,820)
 $bmp.Save((Join-Path $PWD ('assets/artworks/art-{0:d2}.png' -f ($i+1))),[System.Drawing.Imaging.ImageFormat]::Png)
 foreach ($b in $brushes) {$b.Dispose()}; $g.Dispose(); $bmp.Dispose()
}
