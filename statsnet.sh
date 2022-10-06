n=0
while true;do
  down=`cat /proc/net/dev | grep wlan0 | awk '{print $2}'`
  down1=`cat /proc/net/dev | grep lo | awk '{print $2}'`
  up=`cat /proc/net/dev | grep wlan0 | awk '{print $10}'`
  up1=`cat /proc/net/dev | grep lo | awk '{print $10}'`

  down=$(($down+$down1))
  up=$(($up+$up1))

  down=`echo "$down" / 1048576 | bc -l`
  up=`echo "$up" / 1048576 | bc -l`
  printf "download %.2fmb | upload %.2fmb -- %s\n\n" $down $up "`date`"
  n=$((n+1))
  if [[ n -ge 3600 ]]; then
    printf "download %.2fmb | upload %.2fmb -- %s\n\n" $down $up "`date`" >> netstats.md
    n=0
  fi

  sleep 5
done