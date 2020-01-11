function deleteChemical(id){
    $.ajax({
        url: '/chemical/' + id, 
        type: 'DELETE', 
        success: function(result){
            window.location.reload(true);
        }
    })
};