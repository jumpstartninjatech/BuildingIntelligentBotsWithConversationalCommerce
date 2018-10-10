using System;
using System.Collections.Generic;

namespace PictureBot1.Models
{
    // this class is used to pass information about an image for display in our bot
    [Serializable]
    public class SearchHit
    {
        public SearchHit()
        {
            this.PropertyBag = new Dictionary<string, object>();
        }

        public string Key { get; set; }

        public string Title { get; set; }

        public string PictureUrl { get; set; }

        public string Description { get; set; }

        public IDictionary<string, object> PropertyBag { get; set; }
    }
}
