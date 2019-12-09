//Allowing colour change to output 
document.getElementById("approverOutput").onclick = function() {
    var sel = window.getSelection();
    if (sel.rangeCount && sel.getRangeAt) {
      var range = sel.getRangeAt(0);
    }
    // Set design mode to on
    document.designMode = "on";
    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // // Colorize text  
    document.execCommand("ForeColor", false, ""+colourChange()+"") 
    // // Set design mode to off
    document.designMode = "off";
}

function colourChange () {
    var colour = document.getElementById("colour")
    return colour.value
}