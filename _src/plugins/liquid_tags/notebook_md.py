"""
Notebook Tag
------------
This is a liquid-style tag to include a static html rendering of an IPython
notebook in a blog post.

Syntax
------
{% notebook filename.ipynb [ cells[start:end] ]%}

The file should be specified relative to the ``notebooks`` subdirectory of the
content directory.  Optionally, this subdirectory can be specified in the
config file:

    NOTEBOOK_DIR = 'notebooks'

The cells[start:end] statement is optional, and can be used to specify which
block of cells from the notebook to include.

Details
-------
Because the conversion and formatting of notebooks is rather involved, there
are a few extra steps required for this plugin:

- First, the plugin requires that the nbconvert package [1]_ to be in the
  python path. For example, in bash, this can be set via

      >$ export PYTHONPATH=/path/to/nbconvert/

- After typing "make html" when using the notebook tag, a file called
  ``_nb_header.html`` will be produced in the main directory.  The content
  of the file should be included in the header of the theme.  An easy way
  to accomplish this is to add the following lines within the header template
  of the theme you use:

      {% if EXTRA_HEADER %}
        {{ EXTRA_HEADER }}
      {% endif %}

  and in your ``pelicanconf.py`` file, include the line:

      EXTRA_HEADER = open('_nb_header.html').read().decode('utf-8')

[1] https://github.com/ipython/nbconvert
"""
import re
import os
from .mdx_liquid_tags import LiquidTags

# nbconverters: part of the nbconvert package
from converters import ConverterMarkdown  # requires nbconvert package

SYNTAX = "{% notebook_md /path/to/notebook.ipynb [ cells[start:end] ] %}"
FORMAT = re.compile(r"""^(\s+)?(?P<src>\S+)(\s+)?((cells\[)(?P<start>-?[0-9]*):(?P<end>-?[0-9]*)(\]))?(\s+)?$""")


@LiquidTags.register('notebook_md')
def notebook_md(preprocessor, tag, markup):
    match = FORMAT.search(markup)
    if match:
        argdict = match.groupdict()
        src = argdict['src']
        start = argdict['start']
        end = argdict['end']
    else:
        raise ValueError("Error processing input, "
                         "expected syntax: {0}".format(SYNTAX))

    if start:
        start = int(start)
    else:
        start = None

    if end:
        end = int(end)
    else:
        end = None

    settings = preprocessor.configs.config['settings']
    nb_dir =  settings.get('NOTEBOOK_DIR', 'notebooks')
    nb_path = os.path.join('content', nb_dir, src)

    if not os.path.exists(nb_path):
        raise ValueError("File {0} could not be found".format(nb_path))

    # Call the notebook converter
    converter = ConverterMarkdown(infile=nb_path)
    converter.read()

    #body_lines = process_body(converter.main_body('\n'))
    body_lines = converter.main_body('\n')
    
    #body_lines = strip_divs(body_lines, start, end)

    #body = preprocessor.configs.htmlStash.store('\n'.join(body_lines),
    #                                            safe=True)
    result = '\n'.join(body_lines)
    open('nb_md.txt', 'w').write(result)

    return result


#----------------------------------------------------------------------
# This import allows image tag to be a Pelican plugin
from liquid_tags import register
