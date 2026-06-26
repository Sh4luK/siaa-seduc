def get_ip(request):

    x_forwarder_for = request.META.get("HTTP_X_FORWARDER_FOR")
    if x_forwarder_for:
        ip = x_forwarder_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    
    return ip
