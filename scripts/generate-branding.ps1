Add-Type -AssemblyName System.Drawing
foreach ($name in @('icon','splash-icon')) {
 $bmp=[System.Drawing.Bitmap]::new(1024,1024); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'
 $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#FAF8F5'))
 $terracotta=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#A64E36'))
 $charcoal=[System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#262626'),32)
 $g.DrawRectangle($charcoal,245,180,534,664); $g.FillEllipse($terracotta,335,280,350,350)
 $g.FillRectangle($terracotta,330,650,360,75)
 $bmp.Save((Join-Path $PWD "assets/$name.png"),[System.Drawing.Imaging.ImageFormat]::Png)
 $terracotta.Dispose(); $charcoal.Dispose(); $g.Dispose(); $bmp.Dispose()
}
