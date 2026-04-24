import os
import yaml

def load_config():
    # Tìm file config.yaml ở thư mục gốc của service
    config_path = os.path.join(os.getcwd(), 'config.yaml')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    return {}