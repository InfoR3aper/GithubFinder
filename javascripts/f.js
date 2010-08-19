/* PluginBase that allows for mixins into an object */
;( function() { 
window.FP = [];  // finder plugins

window.F = Class.create({
  initialize: function(options){
    options = Object.extend( { 
      user_id:      'rails'
      ,repository:  'rails'
      ,branch:      'master'
    }, options || {} );
    
    this.ps   = [];
    this.shas = {};
    
    this.u    = options.user_id;
    this.r    = options.repository;
    this.b    = options.branch;
    
    this.render();
    
    this.repo = null;

    
    document.on('click','a[data-sha]', function( event, element ){ 
      this.click( element.readAttribute('data-sha'), element );
      // Event.stop(event);
    }.bind(this) );
    
    
    var idc = $('in'),
        s = function() { idc.show() },
        h = function() { if( Ajax.activeRequestCount == 0 ) idc.hide() };
    Ajax.Responders.register( { 
      onException: function(r,x) { console.log(x);h() }
      ,onComplete: h
      ,onCreate: s
    });
    
    /* init plugins */
    if( FP )
      for( var i = 0; i < FP.length; i++ )
        new FP[i](this);
    
    /* extractURL:  if user assigns user_id, repo, branch */
    this.xU();
    this.oR(); // open repo
  }
  
  
  ,xU: function() {
    var p = uP();
    if( p["user_id"] ) this.u   = p["user_id"];
    if( p["repo"] )    this.r   = p["repo"];
    if( p["branch"] )  this.b   = p["branch"];
  }
  
  ,render: function() { 
    $(document.body).insert(this.h());
    this.psW  = $('ps_w');
    this.bW = $('b_w');
    // debugger
  }
    
  ,h: function() {
    return [
      '<div id=content>',
      '<div id=finder class=tbb>',
        '<div id=r_w>',
          '<div class=p>',
            '<div id=url_w>',
              '<span class=big>Github Finder</span>',
              '<span>',
                'Repo: http://github.com/<input type=text id=r />',
                '<span id=brs_w></span>', // branches
                '<input type=button id=go value=Go onclick=f.browse() />',
              '</span>',
              '<span id=in style=display:none>Loading...</span>',
            '</div>',
          '</div>',  // .p
        '</div>',   // #r_w
      
        '<div id=r_i_w class=tbb>', // #repo info wrapper
          '<div class=p><span id=r_i></span></div>',
        '</div>',
      
        '<div id=b_w>', // browser wrapper 
          '<div id=ps_w style="width:200px"></div>',
        '</div>',

        '<div id=i_w>', // info_wrapper
          '<div class=t>Info</div>',
          '<div id=i class=p>Select an item or navigate with arrow keys</div>',
        '</div>',

        '<div class=clear></div>',
      '</div>', // #finder 

      '<div id=f_c_w style="display:none">',                 // file content wrapper
        '<div id=f_h_w>',                 // file header
          '<div class=p>',
            '<div id=f_h class=big></div>',
          '</div>',
        '</div>',
        
        '<div id=f_c>',                 // file content
          '<div class=p>',                 // padding
            '<div id=f_w>',             // file wrapper
              '<div id=f></div>',       // file 
            '</div>',
            '<div id=diffoutput></div>',
          '</div>', // padding
        '</div>',
        
        '<div id=c_w>',                 // commit wrapper
          '<div id=commits>',
            '<div class=t>Commits Log</div>',
            '<div class=p id=c_l_w>Commits Log</div>', // commits log wrapper
          '</div>',
          '<div class=clear></div>',
        '</div>', // #c_w

        '<div class=clear></div>',
      '</div>',  // #f_c_w
      
      '<div id=footer>(c) 2010 Alex Le.  <a href=http://github.com/sr3d/GithubFinder>Fork me</a> on Github</div>',
      '</div>' // # content
    ].join('');
  }

  /* openRepo */
  ,oR: function(repo) {
    this.reset()
    
    var u,r,b = 'master';
    if( !repo ) {
      u = this.u;
      r = this.r;
      b = this.b;
    } else {
      repo = repo.split('/');
      if( repo.length < 2 ) { alert('invalid repository'); return }
      u = this.u    = repo[0];
      r = this.r    = repo[1];
      b = this.b    = $('brs') ? $F('brs') : b;
    }
    
    $('r').value = u + '/' + r;
    

    /* Load the master branch */
    GH.Commits.listBranch( u, r, b, { 
      onData: function(cs) {
        // if(!cs.commits) { alert('repo not found'); return; }
        var tree_sha = cs.commits[0].tree;
        this.renderPanel(tree_sha);
      }.bind(this)
    });
    
    /* Show the repo info */
    GH.Repo.show( u, r, { 
      onData: function(repo) {
        this.repo = repo;
        this.renderRepoInfo();
      }.bind(this)
    });
    
    /* Show branches info */
    GH.Repo.listBranches( u, r, { 
      onData: function(bes) {
        this.bes = $H(bes);
        this.rBs();
      }.bind(this)
    });
    
  }
  
  ,reset: function() {
    $('f_c_w').hide();
    this.cI = -1;
    this.pI = 0;
    
    while(this.ps.length > 0)
      (this.ps.pop()).dispose();
  }
  
  ,browse: function() {
    $('i').innerHTML = '';
    this.oR( $F('r') || $('r').readAttribute('placeholder') );
  }
  /* render the status bar */
  ,renderRepoInfo: function() {
    $('r_i').innerHTML = this.repo.description;
  }
  
  /* render branches */
  ,rBs: function() {
    var h = '<select id=brs>';
    this.bes.each(function(b) { 
      h += 
        '<option ' + (this.b == b.key ? ' selected=""' : ' ' ) + '>' +
          b.key +
        '</option>';
    }.bind(this));
    // html.push('</select>');
    $('brs_w').innerHTML = h + '</select>';
  }
  
  ,renderPanel: function( sh, ix, it ) { 
    ix = ix || 0;
    /* clear previously opened panels */
    for( var i = this.ps.length - 1; i > ix; i-- ) {
      (this.ps.pop()).dispose();
    }
    this.open( sh, it );
  }
  
  ,_resizePanelsWrapper: function() {
    var w = (this.ps.length * 201);
    this.psW.style.width = w + 'px';
    
    /* scroll to the last panel */    
    this.bW.scrollLeft = w;
  }

  /* request the content of the tree and render the panel */
  ,open: function( tree_sha, item ) {
    GH.Tree.show( this.u, this.r, this.b, tree_sha, {
      onData: function(tree) { // tree is already sorted 
        /* add all items to cache */
        for( var i = 0, len = tree.length; i < len; i++ )
          this.shas[ tree[i].sha ] = tree[i];

        var name = item ? item.name : '' ;
        // debugger
        var p = new P( this, { tree: tree, index: this.ps.length, name: name, tree_sha: tree_sha, item: item } );
        this.ps.push( p );
        
        this._resizePanelsWrapper();
        
      }.bind(this)
    });
  }
  
  /**
   * @sha: the sha of the object
   * @e:  the source element
   */
  ,click: function(sha, e) {
    // debugger
    var it = this.shas[ sha ],
        ix = +(e.up('.panel')).readAttribute('data-index'),
        path = "";


    /* set selection cursor && focus the item */
    e.up('ul').select('li.cur').invoke('removeClassName','cur');
    var p = e.up('div.panel'),
        li = e.up('li').addClassName('cur'),
        posTop = li.positionedOffset().top + li.offsetHeight - p.offsetHeight;
    if( posTop > p.scrollTop) {
      p.scrollTop = posTop ;
    }
      

    /* current index */
    this.cI = it.index;
    this.pI = ix; // current panel index;

    /* remember the current selected item */
    this.ps[ ix ].cI = it.index;
    

    /* don't be trigger happy: ptm = preview timer  */
    if(this._p) clearTimeout( this._p );

    /* set a small delay here incase user switches really fast (e.g. keyboard navigation ) */
    this._p = setTimeout( function(){
      
      if( it.type == 'tree' ) {
        this.renderPanel( it.sha, ix, it );
        // don't show file preview panel 
        $('f_c_w').hide();
      } else {
        
        $('f_c_w').show();
        if( /text/.test(it.mime_type) ) {
          $('f').innerHTML = '<div class=p>Loading File</p>';
          GH.Blob.show( this.u, this.r, it.sha, { onSuccess: function(r) {
            this.previewTextFile(r.responseText, it);  
          }.bind(this)} );
        }
      }


      /* display file info */
      for( var i = 0; i <= ix; i++ )
        path += this.ps[i].name + "/";
      path += it.name;


    var c, cs;
    var info = function() {
      var h = [
         '<div><b>Name</b><br/>',
           '<a href=',
             'http://github.com/' + this.u + '/' + this.r + '/' + it.type + '/' + this.b + path,
             ' target=_blank>',
             it.name,
           '</a>',
         '</div>',
         '<br/>',
         '<div><b>Path</b><br/> ' + path + '</div>',

         '<br/>',        
         '<div><b>Last Committed</b><br/> ' + 
           s( c.id ) + ' on ' +
           (new Date(c.committed_date)).toString() + 
         '</div>',
         '<br/>',

         '<div>',
           '<b>Author</b><br/>',
           '<a href=http://github.com/' + c.author.login + '>' + c.author.name + '</a>',
           ' (' + c.author.email +')',
         '</div>',
         '<br/>',
         '<div>',
           '<b>Commit Message</b><br/>',
           c.message,
         '</div>'
       ];
       $('i').update( h.join(''));
    }

    /* showPreview */
    var p = function() {
      $('diffoutput').hide();
      $('f_c_w').show();
      $('f_h').innerHTML = path;
    }

    /* commits log */
    var cl = function() { 
      var dW, dH, dP,
          csHTML = '<div>';
      var dl = function(a,b,l) {  // difflink a, b, label
        return '<a href=javascript:void(0) onclick=f.diff(' + 
            [ '"', a.id, '","',  
              a.tree, '","', 
              b.id, '","',
              b.tree, '","',
              it.name, '"' 
            ].join('') +
          ')>' + l + '</a> ';      
      };
      for( var i = 0; i < cs.length; i++ ) {
        dW = cs.length > 1 ? '<br/>Diff with: ' : '';         // diffWith
        dH = i > 0 ? dl( c , cs[i], 'Head') : '' ;            // diffHead
        dP = cs[i+1] ? dl(cs[i], cs[i+1], 'Previous') : '' ;  // diffPrevious

        csHTML +=
          '<div class=ce>' +
            '<b>' + s(cs[i].id) +'</b>' + ' by ' + cs[i].author.name +
            dW + dH + (dH && dP ? ' - ' : '') + dP +
          '</div>';
      };
      // csHTML.push('</div>');
      $('c_l_w').update( csHTML + '</div>' );
    };

    /* query the cs to get a list of cs and info */
    GH.Commits.list( this.u, this.r, this.b, path, { onData: function(cms) { // cms == commits
      it.c = c = cms[0];  // also assign the it's c to keep track of folder's latest commit
      cs = cms;

      info();

      if( it.type != 'tree' ) { 
        p();
        cl();
      }

    }.bind(this)});
  }.bind(this), 200); // time out


  }
  

  ,previewTextFile: function( text, it ) {
    text = text.replace(/\r\n/, "\n").split(/\n/);

    var ln = [],
        l = [],
        sloc = 0;
    for( var i = 0, len = text.length; i < len; i++ ) {
      ln.push( '<span>' + (i + 1) + "</span>\n");

      l.push( text[i] ? text[i].replace('<', '&lt;').replace('>', '&gt;') : '' );

      // count actual loc
      sloc += text[i] ? 1 : 0;
    }

    var html = [
      '<div class=meta>',
        '<span>' + it.mode + '</span>',
        '<span>' + text.length + ' lines (' + sloc +' sloc)</span>',
        '<span>' + it.size + ' bytes</span>',
      '</div>',

      '<div id=f_c_s>',  // file content scroll
        '<table cellspacing=0 cellpadding=0>',
          '<tr>',
            '<td>',
              '<pre class=ln>',
                ln.join(''),
              '</pre>',
            '</td>',

            '<td width=100% valign=top>',
              '<pre class=code>',
                l.join("\n"),
              '</pre>',
            '</td>',
          '</tr>',
        '</div>'
    ];

    $('diffoutput').hide();
    $('f').update( html.join('') ).show();
  }
});

})();